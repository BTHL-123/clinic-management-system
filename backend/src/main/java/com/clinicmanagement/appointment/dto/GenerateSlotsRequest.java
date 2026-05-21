package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateSlotsRequest(
        @NotNull @Min(1) Integer slotDurationMinutes
) {}
