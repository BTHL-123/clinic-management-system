package com.clinicmanagement.medicine.dto;

import jakarta.validation.constraints.NotBlank;

public record MedicineRequest(
        String medicineCode,

        @NotBlank(message = "medicineName không được để trống")
        String medicineName,

        String activeIngredient,
        String dosageForm,
        String strength,
        String unit,
        String rxnormCode,
        String description,
        String usageInstructions,
        String status
) {}
