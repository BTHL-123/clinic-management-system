package com.clinicmanagement.medicine.dto;

import lombok.Data;

@Data
public class UpdateMedicineRequest {
    private String medicineName;
    private String activeIngredient;
    private String dosageForm;
    private String strength;
    private String unit;
    private String rxnormCode;
    private String description;
    private String status;
}
