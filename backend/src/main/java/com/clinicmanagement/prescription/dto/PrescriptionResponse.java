package com.clinicmanagement.prescription.dto;

import com.clinicmanagement.prescription.Prescription;

import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionResponse(
        Long prescriptionId,
        String prescriptionCode,
        Long consultationId,
        Long patientId,
        Long doctorId,
        String status,
        Boolean drugInteractionChecked,
        String interactionWarning,
        String doctorNote,
        LocalDateTime createdAt,
        LocalDateTime checkedAt,
        LocalDateTime dispensedAt,
        List<PrescriptionItemResponse> items
) {
    public static PrescriptionResponse from(Prescription p) {
        return new PrescriptionResponse(
                p.getPrescriptionId(),
                p.getPrescriptionCode(),
                p.getConsultationId(),
                p.getPatientId(),
                p.getDoctorId(),
                p.getStatus(),
                p.getDrugInteractionChecked(),
                p.getInteractionWarning(),
                p.getDoctorNote(),
                p.getCreatedAt(),
                p.getCheckedAt(),
                p.getDispensedAt(),
                p.getItems().stream().map(PrescriptionItemResponse::from).toList()
        );
    }
}
