package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.payment.dto.CreateOnlinePaymentUrlRequest;
import com.clinicmanagement.payment.dto.CreatePaymentRequest;
import com.clinicmanagement.payment.dto.OnlinePaymentUrlResponse;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.PaymentResponse;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.clinicmanagement.common.event.PaymentCompletedEvent;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PaymentResponse> getAll(Long invoiceId, Long appointmentId, String status, Pageable pageable) {
        Specification<Payment> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (invoiceId != null) {
                predicates.add(cb.equal(root.get("invoice").get("invoiceId"), invoiceId));
            }
            if (appointmentId != null) {
                predicates.add(cb.equal(root.get("appointmentId"), appointmentId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<PaymentResponse> page = paymentRepository.findAll(spec, pageable)
                .map(PaymentResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    @Override
    public PaymentResponse getById(Long id) {
        Payment payment = findOrThrow(id);
        return PaymentResponse.from(payment);
    }

    @Transactional
    @Override
    public PaymentResponse create(CreatePaymentRequest request, User currentUser) {
        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + request.invoiceId()));
        }

        Payment payment = new Payment();
        payment.setPaymentCode(nextPaymentCode());
        payment.setInvoice(invoice);
        payment.setAppointmentId(request.appointmentId());
        payment.setPaymentType(request.paymentType());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setAmount(request.amount());
        payment.setStatus("PENDING");
        payment.setPaidBy(currentUser);

        Payment saved = paymentRepository.save(payment);
        return PaymentResponse.from(saved);
    }

    @Transactional
    @Override
    public PaymentResponse confirmCash(Long paymentId, User currentUser) {
        Payment payment = findOrThrow(paymentId);
        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("Giao dịch thanh toán không ở trạng thái PENDING");
        }
        if (!"CASH".equalsIgnoreCase(payment.getPaymentMethod())) {
            throw new BusinessException("Phương thức thanh toán phải là CASH (Tiền mặt)");
        }

        payment.setStatus("PAID");
        payment.setConfirmedBy(currentUser);
        payment.setPaidAt(LocalDateTime.now());

        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            BigDecimal totalPaid = paymentRepository
                .findAllByInvoiceAndStatus(invoice, "PAID")
                .stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(payment.getAmount());
            
            if (totalPaid.compareTo(invoice.getFinalAmount()) >= 0) {
                invoice.setStatus("PAID");
                invoice.setPaidAt(LocalDateTime.now());
                
                eventPublisher.publishEvent(new PaymentCompletedEvent(
                        payment.getPaymentId(), 
                        invoice.getInvoiceId(), 
                        payment.getPaymentCode()
                ));
            } else {
                invoice.setStatus("PARTIALLY_PAID");
            }
            invoiceRepository.save(invoice);
        }

        Payment saved = paymentRepository.save(payment);
        return PaymentResponse.from(saved);
    }

    @Transactional
    @Override
    public OnlinePaymentUrlResponse createOnlineUrl(CreateOnlinePaymentUrlRequest request, User currentUser) {
        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + request.invoiceId()));
            if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
                throw new BusinessException("Hóa đơn đã được thanh toán");
            }
        }

        Payment payment = new Payment();
        payment.setPaymentCode(nextPaymentCode());
        payment.setInvoice(invoice);
        payment.setAppointmentId(request.appointmentId());
        payment.setPaymentType("FINAL_PAYMENT");
        payment.setPaymentMethod("ONLINE");
        payment.setAmount(request.amount());
        payment.setStatus("PENDING");
        payment.setPaidBy(currentUser);

        Payment saved = paymentRepository.save(payment);
        String paymentUrl = "https://payment-gateway.com/pay/" + saved.getPaymentCode();

        return new OnlinePaymentUrlResponse(saved.getPaymentId(), paymentUrl);
    }

    @Transactional
    @Override
    public PaymentResponse processCallback(PaymentCallbackRequest request) {
        Payment payment = paymentRepository.findByPaymentCode(request.paymentCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch với mã thanh toán: " + request.paymentCode()));

        if ("PAID".equalsIgnoreCase(payment.getStatus())) {
            return PaymentResponse.from(payment);
        }

        if ("PAID".equalsIgnoreCase(request.status())) {
            payment.setStatus("PAID");
            payment.setGatewayTransactionId(request.gatewayTransactionId());
            payment.setPaidAt(LocalDateTime.now());
            payment.setGatewayProvider("SANDBOX_MOCK");

            if (payment.getInvoice() != null) {
                Invoice invoice = payment.getInvoice();
                BigDecimal totalPaid = paymentRepository
                    .findAllByInvoiceAndStatus(invoice, "PAID")
                    .stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .add(payment.getAmount());
                
                if (totalPaid.compareTo(invoice.getFinalAmount()) >= 0) {
                    invoice.setStatus("PAID");
                    invoice.setPaidAt(LocalDateTime.now());
                    
                    eventPublisher.publishEvent(new PaymentCompletedEvent(
                            payment.getPaymentId(), 
                            invoice.getInvoiceId(), 
                            payment.getPaymentCode()
                    ));
                } else {
                    invoice.setStatus("PARTIALLY_PAID");
                }
                invoiceRepository.save(invoice);
            }
        } else {
            payment.setStatus(request.status().toUpperCase());
        }

        Payment saved = paymentRepository.save(payment);
        return PaymentResponse.from(saved);
    }

    private Payment findOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán với ID: " + id));
    }

    private String nextPaymentCode() {
        return "PAY-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

