package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotNull;

public record BookAppointmentRequest(
    Long patientId,
    @NotNull(message = "ID ca khám không được để trống") Long slotId,
    String reasonForVisit,
    String paymentMethod
) {}
