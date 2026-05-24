package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentCallbackRequest(
        @NotBlank(message = "Mã giao dịch cổng thanh toán không được để trống")
        String gatewayTransactionId,

        @NotBlank(message = "Mã thanh toán không được để trống")
        String paymentCode,

        @NotBlank(message = "Trạng thái không được để trống")
        String status,

        @NotNull(message = "Số tiền không được để trống")
        BigDecimal amount
) {}
