package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.payment.dto.CreateRefundRequest;
import com.clinicmanagement.payment.dto.RefundResponse;
import com.clinicmanagement.payment.dto.RejectRefundRequest;
import com.clinicmanagement.user.User;
import java.time.LocalDateTime;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<RefundResponse> getAll(Long paymentId, String status, Pageable pageable) {
        Specification<Refund> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (paymentId != null) {
                predicates.add(cb.equal(root.get("payment").get("paymentId"), paymentId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<RefundResponse> page = refundRepository.findAll(spec, pageable)
                .map(RefundResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    @Override
    public RefundResponse getById(Long id) {
        Refund refund = findOrThrow(id);
        return RefundResponse.from(refund);
    }

    @Transactional
    @Override
    public RefundResponse create(CreateRefundRequest request, User currentUser) {
        Payment payment = paymentRepository.findById(request.paymentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy giao dịch thanh toán với ID: " + request.paymentId()));

        if (!"PAID".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("Chỉ có thể hoàn tiền cho giao dịch đã thanh toán (PAID)");
        }

        if (request.refundAmount().compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("Số tiền hoàn không được lớn hơn số tiền thanh toán");
        }

        Refund refund = new Refund();
        refund.setRefundCode(nextRefundCode());
        refund.setPayment(payment);
        refund.setRefundAmount(request.refundAmount());
        refund.setReason(request.reason());
        
        // Cải tiến: Lễ tân hoàn tiền trực tiếp -> Tự động duyệt và hoàn tất luôn
        refund.setStatus("COMPLETED");
        refund.setRequestedBy(currentUser);
        refund.setApprovedBy(currentUser);
        refund.setApprovedAt(LocalDateTime.now());
        refund.setCompletedAt(LocalDateTime.now());

        // Cập nhật trạng thái payment thành REFUNDED
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        // Cập nhật trạng thái invoice thành REFUNDED nếu có
        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            invoice.setStatus("REFUNDED");
            invoiceRepository.save(invoice);
        }

        Refund saved = refundRepository.save(refund);
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public RefundResponse requestRefund(CreateRefundRequest request, User currentUser) {
        Payment payment = paymentRepository.findById(request.paymentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy giao dịch thanh toán với ID: " + request.paymentId()));

        if (!"PAID".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("Chỉ có thể hoàn tiền cho giao dịch đã thanh toán (PAID)");
        }

        if (request.refundAmount().compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("Số tiền hoàn không được lớn hơn số tiền thanh toán");
        }

        if (payment.getPaidBy() != null && !payment.getPaidBy().getUserId().equals(currentUser.getUserId())) {
            throw new BusinessException("Bạn không có quyền yêu cầu hoàn tiền cho giao dịch này");
        }

        Refund refund = new Refund();
        refund.setRefundCode(nextRefundCode());
        refund.setPayment(payment);
        refund.setRefundAmount(request.refundAmount());
        refund.setReason(request.reason());
        
        refund.setStatus("PENDING");
        refund.setRequestedBy(currentUser);

        Refund saved = refundRepository.save(refund);
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public RefundResponse approve(Long refundId, User currentUser) {
        Refund refund = findOrThrow(refundId);
        if (!"PENDING".equalsIgnoreCase(refund.getStatus())) {
            throw new BusinessException("Yêu cầu hoàn tiền không ở trạng thái PENDING");
        }

        refund.setStatus("APPROVED");
        refund.setApprovedBy(currentUser);
        refund.setApprovedAt(LocalDateTime.now());

        // Cập nhật trạng thái payment thành REFUNDED
        Payment payment = refund.getPayment();
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        // Cập nhật trạng thái invoice thành REFUNDED nếu có
        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            invoice.setStatus("REFUNDED");
            invoiceRepository.save(invoice);
        }

        refund.setCompletedAt(LocalDateTime.now());
        refund.setStatus("COMPLETED");

        Refund saved = refundRepository.save(refund);
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public RefundResponse reject(Long refundId, RejectRefundRequest request, User currentUser) {
        Refund refund = findOrThrow(refundId);
        if (!"PENDING".equalsIgnoreCase(refund.getStatus())) {
            throw new BusinessException("Yêu cầu hoàn tiền không ở trạng thái PENDING");
        }

        refund.setStatus("REJECTED");
        refund.setRejectReason(request.rejectReason());
        refund.setApprovedBy(currentUser);
        refund.setApprovedAt(LocalDateTime.now());

        Refund saved = refundRepository.save(refund);
        return RefundResponse.from(saved);
    }

    private Refund findOrThrow(Long id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hoàn tiền với ID: " + id));
    }

    private String nextRefundCode() {
        Long nextId = refundRepository.findTopByOrderByRefundIdDesc()
                .map(r -> r.getRefundId() + 1)
                .orElse(1L);
        return "REF%06d".formatted(nextId);
    }
}

