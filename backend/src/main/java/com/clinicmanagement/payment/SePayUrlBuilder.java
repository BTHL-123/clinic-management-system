package com.clinicmanagement.payment;

import com.clinicmanagement.common.exception.BusinessException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SePayUrlBuilder {

    @Value("${app.sepay.bank-account:}")
    private String sepayBankAccount;

    @Value("${app.sepay.bank-code:}")
    private String sepayBankCode;

    public String build(Payment payment) {
        if (sepayBankAccount == null || sepayBankAccount.isBlank()
                || sepayBankCode == null || sepayBankCode.isBlank()) {
            throw new BusinessException("SePay bank account configuration is missing");
        }
        BigDecimal amount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        return String.format(
                "https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%d&des=%s",
                urlEncode(sepayBankAccount),
                urlEncode(sepayBankCode),
                amount.longValue(),
                urlEncode(payment.getPaymentCode())
        );
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
