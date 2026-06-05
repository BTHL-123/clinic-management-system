package com.clinicmanagement.payment.dto;

import java.math.BigDecimal;

public record SepayQrResponse(
        Long paymentId,
        BigDecimal amount,
        String paymentCode,
        String transferContent,
        String bankName,
        String accountName,
        String accountNumber,
        String qrCodeUrl
) {
}
