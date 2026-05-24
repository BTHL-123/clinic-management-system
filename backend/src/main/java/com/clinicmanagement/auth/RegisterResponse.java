package com.clinicmanagement.auth;

public record RegisterResponse(
        Long userId,
        Long patientId,
        String email,
        String role
) {
}
