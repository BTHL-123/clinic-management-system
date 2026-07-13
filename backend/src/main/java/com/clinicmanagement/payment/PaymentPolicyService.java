package com.clinicmanagement.payment;

import com.clinicmanagement.common.constants.BillingConstants.SettingKeys;
import com.clinicmanagement.systemsetting.SystemSettingRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentPolicyService {

    private static final int DEFAULT_DEPOSIT_EXPIRY_MINUTES = 10;
    private static final int DEFAULT_REFUND_FULL_BEFORE_HOURS = 24;
    private static final int DEFAULT_REFUND_PARTIAL_BEFORE_HOURS = 2;
    private static final BigDecimal DEFAULT_REFUND_PARTIAL_PERCENT = new BigDecimal("50");

    private final SystemSettingRepository systemSettingRepository;

    public int depositExpiryMinutes() {
        return readInt(SettingKeys.DEPOSIT_EXPIRY_MINUTES, DEFAULT_DEPOSIT_EXPIRY_MINUTES);
    }

    public int refundFullBeforeHours() {
        return readInt(SettingKeys.REFUND_FULL_BEFORE_HOURS, DEFAULT_REFUND_FULL_BEFORE_HOURS);
    }

    public int refundPartialBeforeHours() {
        return readInt(SettingKeys.REFUND_PARTIAL_BEFORE_HOURS, DEFAULT_REFUND_PARTIAL_BEFORE_HOURS);
    }

    public BigDecimal refundPartialPercent() {
        return readBigDecimal(SettingKeys.REFUND_PARTIAL_PERCENT, DEFAULT_REFUND_PARTIAL_PERCENT);
    }

    private int readInt(String key, int fallback) {
        return systemSettingRepository.findBySettingKey(key)
                .map(setting -> setting.getSettingValue())
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> {
                    try {
                        return Integer.parseInt(value);
                    } catch (NumberFormatException ex) {
                        return fallback;
                    }
                })
                .orElse(fallback);
    }

    private BigDecimal readBigDecimal(String key, BigDecimal fallback) {
        return systemSettingRepository.findBySettingKey(key)
                .map(setting -> setting.getSettingValue())
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> {
                    try {
                        return new BigDecimal(value);
                    } catch (NumberFormatException ex) {
                        return fallback;
                    }
                })
                .orElse(fallback);
    }
}
