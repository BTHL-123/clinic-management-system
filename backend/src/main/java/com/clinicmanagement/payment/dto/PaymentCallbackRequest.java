package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentCallbackRequest(
        String gatewayTransactionId,

        @NotBlank(message = "Mã thanh toán không được để trống")
        String paymentCode,

        @NotBlank(message = "Trạng thái không được để trống")
        String status,

        BigDecimal amount
) {}
