package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateOnlinePaymentUrlRequest(
        Long invoiceId,
        Long appointmentId,

        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "0.0", message = "Số tiền phải lớn hơn hoặc bằng 0")
        BigDecimal amount,

        String returnUrl
) {}
