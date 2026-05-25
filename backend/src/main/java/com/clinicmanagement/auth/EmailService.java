package com.clinicmanagement.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:no-reply@clinic.local}")
    private String fromEmail;

    public void sendOtp(String email, String otpCode, String subject, String actionLabel) {
        if (!mailEnabled) {
            log.info("Email OTP for {} ({}): {}", email, actionLabel, otpCode);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject(subject);
        message.setText("""
                Ma OTP cua ban la: %s

                Ma nay dung de %s va se het han sau 10 phut.
                Neu ban khong yeu cau thao tac nay, vui long bo qua email.
                """.formatted(otpCode, actionLabel));
        mailSender.send(message);
    }
}
