package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateRefundRequest(
        @NotNull(message = "Payment ID is required")
        Long paymentId,

        @NotNull(message = "Refund amount is required")
        @DecimalMin(value = "0.01", message = "Refund amount must be greater than 0")
        BigDecimal refundAmount,

        String reason,
        String refundMethod,
        String bankName,
        String bankAccountNumber,
        String accountHolderName
) {
}
