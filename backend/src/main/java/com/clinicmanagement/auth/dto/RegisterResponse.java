package com.clinicmanagement.auth.dto;

public record RegisterResponse(
        Long userId,
        Long patientId,
        String email,
        String role
) {
}

