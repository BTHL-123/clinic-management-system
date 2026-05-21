package com.clinicmanagement.medicine.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MedicineResponse {
    private Long medicineId;
    private String medicineCode;
    private String medicineName;
    private String activeIngredient;
    private String dosageForm;
    private String strength;
    private String unit;
    private String rxnormCode;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
