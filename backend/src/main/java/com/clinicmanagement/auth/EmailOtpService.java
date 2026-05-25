package com.clinicmanagement.auth;

import com.clinicmanagement.common.exception.BusinessException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailOtpService {
    public static final String PURPOSE_REGISTER = "REGISTER";
    public static final String PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";

    private static final int OTP_TTL_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailOtpRepository emailOtpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createAndSend(String email, String purpose) {
        emailOtpRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        String normalizedEmail = normalizeEmail(email);
        String otpCode = "%06d".formatted(RANDOM.nextInt(1_000_000));

        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(normalizedEmail);
        emailOtp.setPurpose(purpose);
        emailOtp.setOtpHash(passwordEncoder.encode(otpCode));
        emailOtp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        emailOtpRepository.save(emailOtp);

        String subject = PURPOSE_REGISTER.equals(purpose)
                ? "Ma OTP xac thuc dang ky"
                : "Ma OTP dat lai mat khau";
        String actionLabel = PURPOSE_REGISTER.equals(purpose)
                ? "xac thuc dang ky tai khoan"
                : "dat lai mat khau";
        emailService.sendOtp(normalizedEmail, otpCode, subject, actionLabel);
    }

    @Transactional
    public void verifyAndConsume(String email, String purpose, String otpCode) {
        EmailOtp emailOtp = emailOtpRepository
                .findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(normalizeEmail(email), purpose)
                .orElseThrow(() -> new BusinessException("OTP is invalid or expired"));

        if (emailOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("OTP is invalid or expired");
        }
        if (!passwordEncoder.matches(otpCode, emailOtp.getOtpHash())) {
            throw new BusinessException("OTP is invalid or expired");
        }

        emailOtp.setConsumed(true);
        emailOtpRepository.save(emailOtp);
    }

    public String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
