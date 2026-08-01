package com.clinicmanagement.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.clinicmanagement.common.exception.BusinessException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class SePayUrlBuilderTest {

    @Test
    void buildsQrUrlFromCurrentConfiguration() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.sepay.bank-account", "0123456789")
                .withProperty("app.sepay.bank-code", "MB Bank");
        Payment payment = payment("PAY-ABC 123", "150000.00");

        String url = new SePayUrlBuilder(environment).build(payment);

        assertEquals(
                "https://qr.sepay.vn/img?acc=0123456789&bank=MB+Bank&amount=150000&des=PAY-ABC+123",
                url
        );
    }

    @Test
    void supportsLegacyAccountNumberConfiguration() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("SEPAY_ACCOUNT_NUMBER", "9876543210")
                .withProperty("SEPAY_BANK_CODE", "MBBank");

        String url = new SePayUrlBuilder(environment).build(payment("PAY-LEGACY", "200000"));

        assertEquals(
                "https://qr.sepay.vn/img?acc=9876543210&bank=MBBank&amount=200000&des=PAY-LEGACY",
                url
        );
    }

    @Test
    void rejectsMissingBankConfigurationWithActionableMessage() {
        BusinessException error = assertThrows(
                BusinessException.class,
                () -> new SePayUrlBuilder(new MockEnvironment()).build(payment("PAY-MISSING", "100000"))
        );

        assertEquals(
                "Chưa cấu hình tài khoản SePay. Vui lòng thiết lập SEPAY_BANK_ACCOUNT và SEPAY_BANK_CODE.",
                error.getMessage()
        );
    }

    private Payment payment(String code, String amount) {
        Payment payment = new Payment();
        payment.setPaymentCode(code);
        payment.setAmount(new BigDecimal(amount));
        return payment;
    }
}
