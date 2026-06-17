package com.clinicmanagement.medicine.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMedicineRequest {
    @NotBlank(message = "Medicine code is required")
    private String medicineCode;

    @NotBlank(message = "Medicine name is required")
    private String medicineName;

    private String activeIngredient;
    private String dosageForm;
    private String strength;
    private String unit;
    private String rxnormCode;
    private String description;
    private String usageInstructions;
}
