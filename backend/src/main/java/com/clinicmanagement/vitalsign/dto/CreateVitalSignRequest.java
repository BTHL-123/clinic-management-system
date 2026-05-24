package com.clinicmanagement.vitalsign.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateVitalSignRequest(
        @NotNull(message = "consultationId không được để trống")
        Long consultationId,

        @NotNull(message = "patientId không được để trống")
        Long patientId,

        BigDecimal heightCm,
        BigDecimal weightKg,
        BigDecimal temperatureC,
        Integer bloodPressureSystolic,
        Integer bloodPressureDiastolic,
        Integer heartRate,
        Integer respiratoryRate,
        Integer spo2
) {}
