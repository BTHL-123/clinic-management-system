package com.clinicmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank String otpCode,
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {
}

