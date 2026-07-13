package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record CompleteRefundRequest(
        @NotBlank(message = "Refund transaction reference is required")
        String refundTransactionRef,
        String refundMethod
) {
}
