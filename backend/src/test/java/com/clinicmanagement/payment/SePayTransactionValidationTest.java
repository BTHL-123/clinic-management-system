package com.clinicmanagement.payment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.email.EmailService;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.notification.NotificationService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

class SePayTransactionValidationTest {

    private PaymentRepository paymentRepository;
    private PaymentServiceImpl paymentService;
    private Payment payment;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        paymentService = new PaymentServiceImpl(
                paymentRepository,
                mock(InvoiceRepository.class),
                mock(AppointmentRepository.class),
                mock(ApplicationEventPublisher.class),
                mock(PaymentPolicyService.class),
                mock(SePayUrlBuilder.class),
                mock(NotificationService.class),
                mock(EmailService.class)
        );

        payment = new Payment();
        payment.setPaymentId(10L);
        payment.setPaymentCode("PAY-ABC12345");
        payment.setAmount(new BigDecimal("150000.00"));
        payment.setCreatedAt(LocalDateTime.of(2026, 8, 1, 10, 0));
    }

    @Test
    void acceptsNewIncomingTransactionWithMatchingCodeAndAmount() {
        Map<String, Object> transaction = validTransaction();

        assertTrue(isValid(transaction));
    }

    @Test
    void rejectsTransactionCreatedBeforeQrPayment() {
        Map<String, Object> transaction = validTransaction();
        transaction.put("transaction_date", "2026-08-01 09:30:00");

        assertFalse(isValid(transaction));
    }

    @Test
    void rejectsOutgoingOrAmountlessTransactions() {
        Map<String, Object> outgoing = validTransaction();
        outgoing.put("transfer_type", "out");

        Map<String, Object> amountless = validTransaction();
        amountless.remove("amount_in");

        assertFalse(isValid(outgoing));
        assertFalse(isValid(amountless));
    }

    @Test
    void rejectsTransactionAlreadyUsedByAnotherPayment() {
        Map<String, Object> transaction = validTransaction();
        when(paymentRepository.existsByGatewayTransactionIdAndPaymentIdNot("TX-001", 10L))
                .thenReturn(true);

        assertFalse(isValid(transaction));
    }

    private Map<String, Object> validTransaction() {
        Map<String, Object> transaction = new HashMap<>();
        transaction.put("reference_number", "TX-001");
        transaction.put("transaction_content", "Thanh toan PAY ABC12345");
        transaction.put("amount_in", "150000.00");
        transaction.put("amount_out", "0.00");
        transaction.put("transfer_type", "in");
        transaction.put(
                "transaction_date",
                payment.getCreatedAt().plusMinutes(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );
        return transaction;
    }

    private boolean isValid(Map<String, Object> transaction) {
        return Boolean.TRUE.equals(ReflectionTestUtils.invokeMethod(
                paymentService,
                "isValidSePayTransaction",
                transaction,
                payment
        ));
    }
}
