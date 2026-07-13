package com.clinicmanagement.payment.dto;

import java.math.BigDecimal;

public record CreateOnlinePaymentUrlRequest(
        Long invoiceId,
        Long appointmentId,
        BigDecimal amount,
        String returnUrl
) {
}
