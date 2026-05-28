package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotNull;

public record RescheduleAppointmentRequest(
        @NotNull(message = "ID ca khám mới không được để trống")
        Long newSlotId,
        String rescheduleReason
) {}
