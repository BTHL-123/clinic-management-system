package com.clinicmanagement.payment;

import com.clinicmanagement.appointment.Appointment;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.common.constants.BillingConstants.InvoiceStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentType;
import com.clinicmanagement.common.constants.BillingConstants.RefundStatus;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.notification.NotificationService;
import com.clinicmanagement.payment.dto.CompleteRefundRequest;
import com.clinicmanagement.payment.dto.CreateRefundRequest;
import com.clinicmanagement.payment.dto.RefundResponse;
import com.clinicmanagement.payment.dto.RejectRefundRequest;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final PaymentPolicyService paymentPolicyService;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<RefundResponse> getAll(Long paymentId, String status, Long patientId, Pageable pageable) {
        Specification<Refund> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (paymentId != null) {
                predicates.add(cb.equal(root.get("payment").get("paymentId"), paymentId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (patientId != null) {
                predicates.add(cb.equal(root.get("payment").get("paidBy").get("userId"), patientId));
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
        return RefundResponse.from(findOrThrow(id));
    }

    @Transactional
    @Override
    public RefundResponse create(CreateRefundRequest request, User currentUser) {
        Payment payment = findPaymentOrThrow(request.paymentId());
        validateRefundablePayment(payment);
        validateNoOverRefund(payment, request.refundAmount());

        Refund refund = buildRefund(request, payment, currentUser);
        refund.setStatus(RefundStatus.PENDING);
        return RefundResponse.from(refundRepository.save(refund));
    }

    @Transactional
    @Override
    public RefundResponse requestRefund(CreateRefundRequest request, User currentUser) {
        Payment payment = findPaymentOrThrow(request.paymentId());
        validateRefundablePayment(payment);

        if (payment.getPaidBy() != null && !payment.getPaidBy().getUserId().equals(currentUser.getUserId())) {
            throw new BusinessException("You cannot request a refund for this payment");
        }

        validatePatientRefundPolicy(payment, request.refundAmount());
        validateNoOverRefund(payment, request.refundAmount());
        Refund refund = buildRefund(request, payment, currentUser);
        refund.setStatus(RefundStatus.PENDING);
        return RefundResponse.from(refundRepository.save(refund));
    }

    @Transactional
    @Override
    public RefundResponse approve(Long refundId, User currentUser) {
        Refund refund = findOrThrow(refundId);
        if (!RefundStatus.PENDING.equals(refund.getStatus())) {
            throw new BusinessException("Refund request is not pending");
        }

        refund.setStatus(RefundStatus.APPROVED);
        refund.setApprovedBy(currentUser);
        refund.setApprovedAt(LocalDateTime.now());

        Refund saved = refundRepository.save(refund);
        notifyRefundStatus(saved, "Refund request approved", "Your refund request has been approved and is waiting for manual transfer.");
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public RefundResponse complete(Long refundId, CompleteRefundRequest request, User currentUser) {
        Refund refund = findOrThrow(refundId);
        if (!RefundStatus.APPROVED.equals(refund.getStatus())) {
            throw new BusinessException("Refund must be approved before completion");
        }

        refund.setStatus(RefundStatus.COMPLETED);
        refund.setRefundTransactionRef(request.refundTransactionRef());
        if (request.refundMethod() != null && !request.refundMethod().isBlank()) {
            refund.setRefundMethod(request.refundMethod());
        }
        refund.setProcessedBy(currentUser);
        refund.setProcessedAt(LocalDateTime.now());
        refund.setCompletedAt(LocalDateTime.now());

        Refund saved = refundRepository.save(refund);
        refreshPaymentRefundStatus(saved.getPayment());
        notifyRefundStatus(saved, "Refund completed", "Your refund has been completed.");
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public RefundResponse reject(Long refundId, RejectRefundRequest request, User currentUser) {
        Refund refund = findOrThrow(refundId);
        if (!RefundStatus.PENDING.equals(refund.getStatus()) && !RefundStatus.APPROVED.equals(refund.getStatus())) {
            throw new BusinessException("Only pending or approved refunds can be rejected");
        }

        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectReason(request.rejectReason());
        refund.setApprovedBy(currentUser);
        refund.setApprovedAt(LocalDateTime.now());

        Refund saved = refundRepository.save(refund);
        notifyRefundStatus(saved, "Refund request rejected", "Your refund request has been rejected.");
        return RefundResponse.from(saved);
    }

    @Transactional
    @Override
    public void createForAppointmentCancellation(Long paymentId, Long appointmentId, boolean clinicCancellation, User currentUser, String reason, String bankName, String bankAccountNumber, String accountHolderName) {
        Payment payment = findPaymentOrThrow(paymentId);
        validateRefundablePayment(payment);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        BigDecimal eligibleAmount = calculateEligibleRefundAmount(payment, appointment, clinicCancellation);
        if (eligibleAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal activeRefunded = refundRepository.sumActiveRefundAmountByPaymentId(payment.getPaymentId());
        BigDecimal remainingRefundable = payment.getAmount().subtract(activeRefunded);
        if (remainingRefundable.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        
        // Patients without bank details submit the refund request themselves later.
        // Clinic cancellations still create a full approved refund for staff processing.
        boolean hasBankInfo = bankAccountNumber != null && !bankAccountNumber.isBlank();
        if (!clinicCancellation && !hasBankInfo) {
            return;
        }

        BigDecimal refundAmount = eligibleAmount.min(remainingRefundable);

        Refund refund = new Refund();
        refund.setRefundCode(nextRefundCode());
        refund.setPayment(payment);
        refund.setRefundAmount(refundAmount);
        refund.setReason(reason != null && !reason.isBlank() ? reason : "Appointment cancellation");
        refund.setRequestedBy(currentUser);
        refund.setRefundMethod("BANK_TRANSFER");
        refund.setBankName(bankName);
        refund.setBankAccountNumber(bankAccountNumber);
        refund.setAccountHolderName(accountHolderName);
        
        refund.setStatus(clinicCancellation ? RefundStatus.APPROVED : RefundStatus.PENDING);
        if (clinicCancellation) {
            refund.setApprovedBy(currentUser);
            refund.setApprovedAt(LocalDateTime.now());
        }
        refundRepository.save(refund);
    }

    private Refund buildRefund(CreateRefundRequest request, Payment payment, User currentUser) {
        Refund refund = new Refund();
        refund.setRefundCode(nextRefundCode());
        refund.setPayment(payment);
        refund.setRefundAmount(request.refundAmount());
        refund.setReason(request.reason());
        refund.setRefundMethod(request.refundMethod());
        refund.setBankName(request.bankName());
        refund.setBankAccountNumber(request.bankAccountNumber());
        refund.setAccountHolderName(request.accountHolderName());
        refund.setRequestedBy(currentUser);
        return refund;
    }

    private BigDecimal calculateEligibleRefundAmount(Payment payment, Appointment appointment, boolean clinicCancellation) {
        if (clinicCancellation) {
            return payment.getAmount();
        }

        LocalDateTime appointmentDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime now = LocalDateTime.now();
        if (!appointmentDateTime.isAfter(now)) {
            return BigDecimal.ZERO;
        }

        if (!now.plusHours(paymentPolicyService.refundFullBeforeHours()).isAfter(appointmentDateTime)) {
            return payment.getAmount();
        }
        if (!now.plusHours(paymentPolicyService.refundPartialBeforeHours()).isAfter(appointmentDateTime)) {
            return payment.getAmount()
                    .multiply(paymentPolicyService.refundPartialPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private void validateRefundablePayment(Payment payment) {
        if (!PaymentStatus.PAID.equals(payment.getStatus())) {
            throw new BusinessException("Only paid payments can be refunded");
        }
        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Payment amount is not refundable");
        }
    }

    private void validateNoOverRefund(Payment payment, BigDecimal requestedAmount) {
        if (requestedAmount == null || requestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Refund amount must be greater than 0");
        }

        BigDecimal activeRefunded = refundRepository.sumActiveRefundAmountByPaymentId(payment.getPaymentId());
        BigDecimal remainingRefundable = payment.getAmount().subtract(activeRefunded);
        if (requestedAmount.compareTo(remainingRefundable) > 0) {
            throw new BusinessException("Refund amount exceeds remaining refundable amount");
        }
    }

    private void validatePatientRefundPolicy(Payment payment, BigDecimal requestedAmount) {
        if (!PaymentType.DEPOSIT.equals(payment.getPaymentType()) || payment.getAppointmentId() == null) {
            return;
        }
        Appointment appointment = appointmentRepository.findById(payment.getAppointmentId()).orElse(null);
        if (appointment == null) {
            return;
        }
        if (!"CANCELLED".equals(appointment.getStatus())) {
            throw new BusinessException("Appointment must be cancelled before requesting a refund");
        }
        BigDecimal eligibleAmount = calculateEligibleRefundAmount(payment, appointment, false);
        if (eligibleAmount.compareTo(BigDecimal.ZERO) <= 0 || requestedAmount.compareTo(eligibleAmount) > 0) {
            throw new BusinessException("Requested refund exceeds the cancellation policy amount");
        }
    }

    private void refreshPaymentRefundStatus(Payment payment) {
        BigDecimal completedRefunded = refundRepository.sumCompletedRefundAmountByPaymentId(payment.getPaymentId());
        if (completedRefunded.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            if (PaymentType.FINAL_PAYMENT.equals(payment.getPaymentType()) && payment.getInvoice() != null) {
                Invoice invoice = payment.getInvoice();
                invoice.setStatus(InvoiceStatus.REFUNDED);
                invoiceRepository.save(invoice);
            }
        }
    }

    private void notifyRefundStatus(Refund refund, String title, String message) {
        try {
            if (refund.getPayment() != null && refund.getPayment().getPaidBy() != null) {
                notificationService.createNotification(
                        refund.getPayment().getPaidBy().getUserId(),
                        title,
                        message,
                        "SYSTEM"
                );
            }
        } catch (Exception ignored) {
            // Notification delivery must not roll back refund state.
        }
    }

    private Payment findPaymentOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    private Refund findOrThrow(Long id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found: " + id));
    }

    private String nextRefundCode() {
        Long nextId = refundRepository.findTopByOrderByRefundIdDesc()
                .map(r -> r.getRefundId() + 1)
                .orElse(1L);
        return "REF%06d".formatted(nextId);
    }
}
