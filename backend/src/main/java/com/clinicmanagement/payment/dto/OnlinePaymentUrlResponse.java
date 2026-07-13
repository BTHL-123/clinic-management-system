package com.clinicmanagement.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OnlinePaymentUrlResponse(
        Long paymentId,
        String paymentUrl,
        String paymentCode,
        BigDecimal amount,
        LocalDateTime expiresAt
) {}
