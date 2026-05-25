package com.clinicmanagement.medicine.dto;

import com.clinicmanagement.medicine.Medicine;
import java.time.LocalDateTime;

public record MedicineResponse(
        Long medicineId,
        String medicineCode,
        String medicineName,
        String activeIngredient,
        String dosageForm,
        String strength,
        String unit,
        String rxnormCode,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MedicineResponse from(Medicine medicine) {
        return new MedicineResponse(
                medicine.getMedicineId(),
                medicine.getMedicineCode(),
                medicine.getMedicineName(),
                medicine.getActiveIngredient(),
                medicine.getDosageForm(),
                medicine.getStrength(),
                medicine.getUnit(),
                medicine.getRxnormCode(),
                medicine.getDescription(),
                medicine.getStatus(),
                medicine.getCreatedAt(),
                medicine.getUpdatedAt()
        );
    }
}
