package com.clinicmanagement.consultation.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeConsultationStatusRequest(
        @NotBlank(message = "status không được để trống")
        String status
) {}
