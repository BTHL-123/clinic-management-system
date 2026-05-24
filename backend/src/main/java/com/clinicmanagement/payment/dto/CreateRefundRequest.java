package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateRefundRequest(
        @NotNull(message = "Payment ID không được để trống")
        Long paymentId,

        @NotNull(message = "Số tiền hoàn không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền hoàn phải lớn hơn 0")
        BigDecimal refundAmount,

        String reason
) {}
