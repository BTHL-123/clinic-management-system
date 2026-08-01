package com.clinicmanagement.payment;

import com.clinicmanagement.appointment.Appointment;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.appointment.TimeSlot;
import com.clinicmanagement.common.constants.BillingConstants.AppointmentStatus;
import com.clinicmanagement.common.constants.BillingConstants.InvoiceStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentMethod;
import com.clinicmanagement.common.constants.BillingConstants.PaymentStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentType;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.event.PaymentCompletedEvent;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.email.EmailService;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.notification.NotificationService;
import com.clinicmanagement.payment.dto.CreateOnlinePaymentUrlRequest;
import com.clinicmanagement.payment.dto.CreatePaymentRequest;
import com.clinicmanagement.payment.dto.OnlinePaymentUrlResponse;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.PaymentResponse;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PaymentPolicyService paymentPolicyService;
    private final SePayUrlBuilder sePayUrlBuilder;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.sepay.api-key:}")
    private String sepayApiKey;

    @Value("${app.sepay.webhook-requires-verification:true}")
    private boolean sepayWebhookRequiresVerification;

    @Value("${app.sepay.transactions-url:https://my.sepay.vn/userapi/transactions/list}")
    private String sepayTransactionsUrl;

    @Value("${app.sepay.bank-account:}")
    private String sepayBankAccount;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PaymentResponse> getAll(Long invoiceId, Long appointmentId, String status, Long patientId, Pageable pageable) {
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
            if (patientId != null) {
                predicates.add(cb.equal(root.get("paidBy").get("userId"), patientId));
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
        return PaymentResponse.from(findOrThrow(id));
    }

    @Transactional
    @Override
    public PaymentResponse create(CreatePaymentRequest request, User currentUser) {
        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.invoiceId()));
            if (InvoiceStatus.PAID.equals(invoice.getStatus())) {
                throw new BusinessException("Invoice is already paid");
            }
        }

        Payment payment = new Payment();
        payment.setPaymentCode(nextPaymentCode());
        payment.setInvoice(invoice);
        payment.setAppointmentId(request.appointmentId());
        payment.setPaymentType(request.paymentType());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setAmount(request.amount());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaidBy(currentUser);

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    @Transactional
    @Override
    public PaymentResponse confirmCash(Long paymentId, User currentUser) {
        Payment payment = findOrThrow(paymentId);
        if (!PaymentStatus.PENDING.equals(payment.getStatus())) {
            throw new BusinessException("Payment is not pending");
        }
        if (!PaymentMethod.CASH.equals(payment.getPaymentMethod())) {
            throw new BusinessException("Payment method must be CASH");
        }

        markPaymentPaid(payment, currentUser, "CASH", null);
        return PaymentResponse.from(payment);
    }

    @Transactional
    @Override
    public OnlinePaymentUrlResponse createOnlineUrl(CreateOnlinePaymentUrlRequest request, User currentUser) {
        Payment payment;
        if (request.invoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.invoiceId()));
            if (InvoiceStatus.PAID.equals(invoice.getStatus())) {
                throw new BusinessException("Invoice is already paid");
            }
            BigDecimal remaining = remainingAmount(invoice);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("Invoice has no remaining balance");
            }
            payment = new Payment();
            payment.setInvoice(invoice);
            payment.setAppointmentId(invoice.getAppointmentId());
            payment.setPaymentType(PaymentType.FINAL_PAYMENT);
            payment.setAmount(remaining);
        } else if (request.appointmentId() != null) {
            payment = paymentRepository
                    .findFirstByAppointmentIdAndPaymentTypeOrderByPaymentIdDesc(request.appointmentId(), PaymentType.DEPOSIT)
                    .filter(existing -> PaymentStatus.PENDING.equals(existing.getStatus()))
                    .orElseGet(() -> createPendingDepositPayment(request.appointmentId(), currentUser));
        } else {
            throw new BusinessException("Either invoiceId or appointmentId is required");
        }

        if (payment.getPaymentId() == null) {
            payment.setPaymentCode(nextPaymentCode());
            payment.setPaymentMethod(PaymentMethod.ONLINE);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaidBy(currentUser);
            payment = paymentRepository.save(payment);
        }

        return toOnlinePaymentUrlResponse(payment);
    }

    @Transactional
    @Override
    public PaymentResponse processCallback(PaymentCallbackRequest request) {
        Payment payment = paymentRepository.findByPaymentCode(request.paymentCode())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + request.paymentCode()));

        if (PaymentStatus.PAID.equals(payment.getStatus())) {
            return PaymentResponse.from(payment);
        }

        if (PaymentStatus.PAID.equalsIgnoreCase(request.status())) {
            assertAmountMatches(payment, request.amount());
            String gatewayTransactionId = request.gatewayTransactionId();
            if (sepayWebhookRequiresVerification) {
                Map<String, Object> matchedTransaction = findSePayTransaction(payment);
                if (matchedTransaction == null) {
                    throw new BusinessException("No SePay transaction found for payment code: " + payment.getPaymentCode());
                }
                assertAmountMatches(payment, extractAmount(matchedTransaction));
                gatewayTransactionId = extractTransactionId(matchedTransaction);
            }
            markPaymentPaid(payment, null, "SEPAY_CALLBACK", gatewayTransactionId);
        } else {
            payment.setStatus(request.status().toUpperCase());
            paymentRepository.save(payment);
        }

        return PaymentResponse.from(payment);
    }

    @Transactional
    @Override
    public PaymentResponse verifySePayTransaction(Long paymentId, User currentUser) {
        Payment payment = findOrThrow(paymentId);

        if (PaymentStatus.PAID.equals(payment.getStatus())) {
            return PaymentResponse.from(payment);
        }
        if (!PaymentStatus.PENDING.equals(payment.getStatus())) {
            throw new BusinessException("Payment is not pending and cannot be verified");
        }

        Map<String, Object> matchedTransaction = findSePayTransaction(payment);
        if (matchedTransaction == null) {
            throw new BusinessException("No SePay transaction found for payment code: " + payment.getPaymentCode());
        }

        BigDecimal transactionAmount = extractAmount(matchedTransaction);
        assertAmountMatches(payment, transactionAmount);
        markPaymentPaid(
                payment,
                currentUser,
                "SEPAY",
                extractTransactionId(matchedTransaction)
        );

        return PaymentResponse.from(payment);
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void releaseExpiredDepositPayments() {
        List<Payment> expiredPayments = paymentRepository.findExpiredPendingDepositPayments(LocalDateTime.now());
        for (Payment payment : expiredPayments) {
            payment.setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);

            if (payment.getAppointmentId() == null) {
                continue;
            }
            appointmentRepository.findById(payment.getAppointmentId()).ifPresent(appointment -> {
                if (!AppointmentStatus.PENDING_PAYMENT.equals(appointment.getStatus())) {
                    return;
                }
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancellationReason("PAYMENT_TIMEOUT");
                appointment.setCancelledAt(LocalDateTime.now());
                releaseAppointmentSlot(appointment);
                appointmentRepository.save(appointment);
            });
        }
    }

    private Payment createPendingDepositPayment(Long appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        if (!AppointmentStatus.PENDING_PAYMENT.equals(appointment.getStatus())) {
            throw new BusinessException("Deposit payment can only be created for PENDING_PAYMENT appointments");
        }

        Payment payment = new Payment();
        payment.setAppointmentId(appointmentId);
        payment.setPaymentType(PaymentType.DEPOSIT);
        payment.setAmount(appointment.getDepositAmount());
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(paymentPolicyService.depositExpiryMinutes()));
        payment.setPaidBy(currentUser);
        return payment;
    }

    private void markPaymentPaid(Payment payment, User confirmedBy, String provider, String gatewayTransactionId) {
        if (!PaymentStatus.PENDING.equals(payment.getStatus())) {
            if (PaymentStatus.PAID.equals(payment.getStatus())) {
                return;
            }
            throw new BusinessException("Payment cannot be paid from status: " + payment.getStatus());
        }
        if (payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Payment has expired");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setConfirmedBy(confirmedBy);
        payment.setPaidAt(LocalDateTime.now());
        payment.setGatewayProvider(provider);
        payment.setGatewayTransactionId(gatewayTransactionId);
        paymentRepository.save(payment);

        if (PaymentType.DEPOSIT.equals(payment.getPaymentType())) {
            confirmDepositAppointment(payment);
        }
        if (payment.getInvoice() != null) {
            refreshInvoiceAfterPayment(payment.getInvoice(), payment);
        }
    }

    private void confirmDepositAppointment(Payment payment) {
        if (payment.getAppointmentId() == null) {
            return;
        }
        Appointment appointment = appointmentRepository.findById(payment.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + payment.getAppointmentId()));

        if (AppointmentStatus.CONFIRMED.equals(appointment.getStatus())) {
            return;
        }
        if (!AppointmentStatus.PENDING_PAYMENT.equals(appointment.getStatus())) {
            throw new BusinessException("Appointment cannot be confirmed from status: " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        if (appointment.getTimeSlot() != null) {
            TimeSlot slot = appointment.getTimeSlot();
            slot.setStatus("BOOKED");
            slot.setLockedByPatientId(null);
            slot.setLockedUntil(null);
        }

        Appointment saved = appointmentRepository.save(appointment);
        notifyConfirmedAppointment(saved);
    }

    private void refreshInvoiceAfterPayment(Invoice invoice, Payment sourcePayment) {
        BigDecimal paidAmount = paymentRepository.sumPaidAmountByInvoiceId(invoice.getInvoiceId());
        if (paidAmount.compareTo(invoice.getFinalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            if (invoice.getPaidAt() == null) {
                invoice.setPaidAt(LocalDateTime.now());
            }
            invoiceRepository.save(invoice);
            completeAppointmentIfNeeded(invoice.getAppointmentId());
            eventPublisher.publishEvent(new PaymentCompletedEvent(
                    sourcePayment.getPaymentId(),
                    invoice.getInvoiceId(),
                    sourcePayment.getPaymentCode()
            ));
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            invoiceRepository.save(invoice);
            markAppointmentPaymentDue(invoice.getAppointmentId());
        }
    }

    private void completeAppointmentIfNeeded(Long appointmentId) {
        if (appointmentId == null) {
            return;
        }
        appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
            if (!AppointmentStatus.CANCELLED.equals(appointment.getStatus())
                    && !AppointmentStatus.NO_SHOW.equals(appointment.getStatus())) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentRepository.save(appointment);
            }
        });
    }

    private void markAppointmentPaymentDue(Long appointmentId) {
        if (appointmentId == null) {
            return;
        }
        appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
            if (!AppointmentStatus.CANCELLED.equals(appointment.getStatus())
                    && !AppointmentStatus.NO_SHOW.equals(appointment.getStatus())
                    && !AppointmentStatus.COMPLETED.equals(appointment.getStatus())) {
                appointment.setStatus(AppointmentStatus.PAYMENT_DUE);
                appointmentRepository.save(appointment);
            }
        });
    }

    private BigDecimal remainingAmount(Invoice invoice) {
        BigDecimal paidAmount = paymentRepository.sumPaidAmountByInvoiceId(invoice.getInvoiceId());
        BigDecimal remaining = invoice.getFinalAmount().subtract(paidAmount);
        return remaining.compareTo(BigDecimal.ZERO) > 0 ? remaining : BigDecimal.ZERO;
    }

    private OnlinePaymentUrlResponse toOnlinePaymentUrlResponse(Payment payment) {
        return new OnlinePaymentUrlResponse(
                payment.getPaymentId(),
                sePayUrlBuilder.build(payment),
                payment.getPaymentCode(),
                payment.getAmount(),
                payment.getExpiresAt()
        );
    }

    private void assertAmountMatches(Payment payment, BigDecimal receivedAmount) {
        if (receivedAmount == null) {
            throw new BusinessException("SePay transaction does not contain a valid incoming amount");
        }
        if (payment.getAmount().compareTo(receivedAmount) != 0) {
            throw new BusinessException("Payment amount does not match expected amount");
        }
    }

    private Map<String, Object> findSePayTransaction(Payment payment) {
        if (sepayApiKey == null || sepayApiKey.isBlank()) {
            throw new BusinessException("SePay API key configuration is missing");
        }
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + sepayApiKey);
            headers.set("Content-Type", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromUriString(sepayTransactionsUrl)
                    .queryParam("limit", 50)
                    .queryParam("amount_in", payment.getAmount().stripTrailingZeros().toPlainString());
            if (payment.getCreatedAt() != null) {
                urlBuilder.queryParam("transaction_date_min", payment.getCreatedAt().toLocalDate());
            }
            if (sepayBankAccount != null && !sepayBankAccount.isBlank()) {
                urlBuilder.queryParam("account_number", sepayBankAccount.trim());
            }

            ResponseEntity<Map> response = restTemplate.exchange(
                    urlBuilder.build().encode().toUriString(),
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return null;
            }
            Object transactionsObject = response.getBody().get("transactions");
            if (transactionsObject == null) {
                transactionsObject = response.getBody().get("data");
            }
            if (!(transactionsObject instanceof List<?> transactions)) {
                return null;
            }
            for (Object item : transactions) {
                if (!(item instanceof Map<?, ?> rawTransaction)) {
                    continue;
                }
                Map<String, Object> transaction = (Map<String, Object>) rawTransaction;
                if (isValidSePayTransaction(transaction, payment)) {
                    return transaction;
                }
            }
            return null;
        } catch (Exception e) {
            throw new BusinessException("Error connecting to SePay. Please try again later.");
        }
    }

    private boolean isValidSePayTransaction(Map<String, Object> transaction, Payment payment) {
        if (!matchesPaymentCode(transaction, payment.getPaymentCode())) {
            return false;
        }

        BigDecimal amountIn = extractAmount(transaction);
        if (amountIn == null
                || amountIn.compareTo(BigDecimal.ZERO) <= 0
                || payment.getAmount().compareTo(amountIn) != 0) {
            return false;
        }

        Object transferType = transaction.get("transfer_type");
        if (transferType != null
                && !List.of("IN", "CREDIT").contains(transferType.toString().trim().toUpperCase())) {
            return false;
        }

        LocalDateTime transactionDate = extractTransactionDate(transaction);
        if (transactionDate == null || payment.getCreatedAt() == null
                || transactionDate.isBefore(payment.getCreatedAt().minusMinutes(1))) {
            return false;
        }

        String transactionId = extractTransactionId(transaction);
        return transactionId != null
                && !paymentRepository.existsByGatewayTransactionIdAndPaymentIdNot(
                        transactionId,
                        payment.getPaymentId()
                );
    }

    private LocalDateTime extractTransactionDate(Map<String, Object> transaction) {
        Object rawDate = transaction.get("transaction_date");
        if (rawDate == null) {
            return null;
        }
        String value = rawDate.toString().trim();
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // SePay v1 uses yyyy-MM-dd HH:mm:ss without an offset.
        }
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String extractTransactionId(Map<String, Object> transaction) {
        Object value = transaction.get("reference_number");
        if (value == null) {
            value = transaction.get("transaction_id");
        }
        if (value == null) {
            value = transaction.get("id");
        }
        return value == null || value.toString().isBlank() ? null : value.toString();
    }

    private boolean matchesPaymentCode(Map<String, Object> transaction, String paymentCode) {
        String expected = normalizePaymentCode(paymentCode);
        for (String key : List.of(
                "transaction_content",
                "content",
                "description",
                "transfer_content",
                "code",
                "reference_number"
        )) {
            Object value = transaction.get(key);
            if (value != null && normalizePaymentCode(value.toString()).contains(expected)) {
                return true;
            }
        }
        return false;
    }

    private String normalizePaymentCode(String value) {
        if (value == null) {
            return "";
        }
        return value.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private BigDecimal extractAmount(Map<String, Object> transaction) {
        for (String key : List.of("amount_in", "amount", "transferAmount", "transfer_amount")) {
            Object value = transaction.get(key);
            if (value == null) {
                continue;
            }
            try {
                return new BigDecimal(value.toString().replace(",", "").trim());
            } catch (NumberFormatException ignored) {
                // Try the next key.
            }
        }
        return null;
    }

    private void releaseAppointmentSlot(Appointment appointment) {
        if (appointment.getTimeSlot() == null) {
            return;
        }
        TimeSlot slot = appointment.getTimeSlot();
        slot.setStatus("AVAILABLE");
        slot.setLockedByPatientId(null);
        slot.setLockedUntil(null);
    }

    private void notifyConfirmedAppointment(Appointment appointment) {
        try {
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                notificationService.createNotification(
                        appointment.getPatient().getUser().getUserId(),
                        "Dat lich thanh cong",
                        "Lich hen " + appointment.getAppointmentCode() + " da duoc xac nhan sau khi thanh toan coc.",
                        "APPOINTMENT"
                );
            }
            if (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null) {
                notificationService.createNotification(
                        appointment.getDoctor().getUser().getUserId(),
                        "Lich hen moi",
                        "Benh nhan " + appointment.getPatient().getFullName() + " da xac nhan lich hen "
                                + appointment.getAppointmentCode() + ".",
                        "APPOINTMENT"
                );
            }
            emailService.sendBookingConfirmation(appointment);
        } catch (Exception ignored) {
            // Notifications must not roll back a successful payment.
        }
    }

    private Payment findOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    private String nextPaymentCode() {
        return "PAY-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
