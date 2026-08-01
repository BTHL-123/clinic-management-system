package com.clinicmanagement.payment;

import com.clinicmanagement.common.exception.BusinessException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SePayUrlBuilder {

    private final Environment environment;

    public String build(Payment payment) {
        String sepayBankAccount = firstConfiguredValue(
                "app.sepay.bank-account",
                "SEPAY_BANK_ACCOUNT",
                "sepay.account-number",
                "SEPAY_ACCOUNT_NUMBER"
        );
        String sepayBankCode = firstConfiguredValue(
                "app.sepay.bank-code",
                "SEPAY_BANK_CODE",
                "sepay.bank-code"
        );
        if (sepayBankAccount == null || sepayBankCode == null) {
            throw new BusinessException(
                    "Chưa cấu hình tài khoản SePay. Vui lòng thiết lập SEPAY_BANK_ACCOUNT và SEPAY_BANK_CODE."
            );
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

    private String firstConfiguredValue(String... propertyNames) {
        for (String propertyName : propertyNames) {
            String value = environment.getProperty(propertyName);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
