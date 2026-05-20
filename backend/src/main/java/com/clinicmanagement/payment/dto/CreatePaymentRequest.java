package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaymentRequest(
        Long invoiceId,
        Long appointmentId,

        @NotBlank(message = "Loại thanh toán không được để trống")
        String paymentType,

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        String paymentMethod,

        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "0.0", message = "Số tiền phải lớn hơn hoặc bằng 0")
        BigDecimal amount
) {}
