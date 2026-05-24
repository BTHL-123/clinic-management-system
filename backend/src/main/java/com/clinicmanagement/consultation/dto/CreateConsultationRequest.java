package com.clinicmanagement.consultation.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConsultationRequest(
        @NotNull(message = "appointmentId không được để trống")
        Long appointmentId,

        @NotNull(message = "patientId không được để trống")
        Long patientId,

        @NotNull(message = "doctorId không được để trống")
        Long doctorId
) {}
