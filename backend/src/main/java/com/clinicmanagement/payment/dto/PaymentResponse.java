package com.clinicmanagement.payment.dto;

import com.clinicmanagement.payment.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        String paymentCode,
        String status,
        Long invoiceId,
        Long appointmentId,
        String paymentType,
        String paymentMethod,
        BigDecimal amount,
        String gatewayTransactionId,
        LocalDateTime paidAt,
        LocalDateTime createdAt,
        LocalDateTime expiresAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getPaymentId(),
                payment.getPaymentCode(),
                payment.getStatus(),
                payment.getInvoice() != null ? payment.getInvoice().getInvoiceId() : null,
                payment.getAppointmentId(),
                payment.getPaymentType(),
                payment.getPaymentMethod(),
                payment.getAmount(),
                payment.getGatewayTransactionId(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getExpiresAt()
        );
    }
}
