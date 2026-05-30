package com.clinicmanagement.prescription.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PrescriptionItemRequest(
        @NotNull(message = "medicineId is required")
        Long medicineId,

        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer quantity,

        String dosage,
        String frequency,
        String duration,
        String instructions,
        String morningDose,
        String noonDose,
        String eveningDose,
        String nightDose
) {}
