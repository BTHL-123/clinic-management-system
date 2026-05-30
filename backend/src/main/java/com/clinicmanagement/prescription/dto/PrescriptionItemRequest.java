package com.clinicmanagement.prescription.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PrescriptionItemRequest(
        @NotNull(message = "medicineId không được để trống")
        Long medicineId,

        @NotNull(message = "quantity không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
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
