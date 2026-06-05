package com.clinicmanagement.payment.dto;

import java.math.BigDecimal;

public record SepayWebhookRequest(
        Long id,
        String gateway,
        String transactionDate,
        String accountNumber,
        String code,
        String content,
        String transferType,
        BigDecimal transferAmount,
        BigDecimal accumulated,
        String subAccount,
        String referenceCode,
        String description
) {
}
