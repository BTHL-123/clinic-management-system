package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotBlank;

public record CancelScheduleRequest(
        @NotBlank String reason
) {}
