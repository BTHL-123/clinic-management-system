package com.clinicmanagement.auth;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(String email, String purpose);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
