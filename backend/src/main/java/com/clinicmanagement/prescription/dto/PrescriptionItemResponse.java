package com.clinicmanagement.prescription.dto;

import com.clinicmanagement.prescription.PrescriptionItem;

public record PrescriptionItemResponse(
        Long prescriptionItemId,
        Long medicineId,
        String medicineName,
        String medicineCode,
        String dosageForm,
        String strength,
        String unit,
        Integer quantity,
        String dosage,
        String frequency,
        String duration,
        String instructions,
        String morningDose,
        String noonDose,
        String eveningDose,
        String nightDose,
        String administrationRoute,
        String administrationTiming,
        String administrationSite,
        String packageInfo,
        boolean asNeeded
) {
    public static PrescriptionItemResponse from(PrescriptionItem item) {
        var med = item.getMedicine();
        return new PrescriptionItemResponse(
                item.getPrescriptionItemId(),
                med.getMedicineId(),
                med.getMedicineName(),
                med.getMedicineCode(),
                med.getDosageForm(),
                med.getStrength(),
                med.getUnit(),
                item.getQuantity(),
                item.getDosage(),
                item.getFrequency(),
                item.getDuration(),
                item.getInstructions(),
                item.getMorningDose(),
                item.getNoonDose(),
                item.getEveningDose(),
                item.getNightDose(),
                item.getAdministrationRoute(),
                item.getAdministrationTiming(),
                item.getAdministrationSite(),
                item.getPackageInfo(),
                item.isAsNeeded()
        );
    }
}
