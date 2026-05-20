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
    public static MedicineResponse from(Medicine m) {
        return new MedicineResponse(
                m.getMedicineId(),
                m.getMedicineCode(),
                m.getMedicineName(),
                m.getActiveIngredient(),
                m.getDosageForm(),
                m.getStrength(),
                m.getUnit(),
                m.getRxnormCode(),
                m.getDescription(),
                m.getStatus(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
