package com.clinicmanagement.medicalrecord.dto;

import com.clinicmanagement.medicalrecord.MedicalRecord;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MedicalRecordResponse(
        Long medicalRecordId,
        Long consultationId,
        Long patientId,
        Long doctorId,
        String doctorName,
        String departmentName,
        String symptoms,
        String clinicalFindings,
        String diagnosis,
        String treatmentPlan,
        String doctorNote,
        LocalDate followUpDate,
        String followUpNote,
        String voiceInputTranscript,
        String aiSummary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MedicalRecordResponse from(MedicalRecord record) {
        return from(record, null, null);
    }

    public static MedicalRecordResponse from(MedicalRecord record, String doctorName, String departmentName) {
        return new MedicalRecordResponse(
                record.getMedicalRecordId(),
                record.getConsultationId(),
                record.getPatientId(),
                record.getDoctorId(),
                doctorName,
                departmentName,
                record.getSymptoms(),
                record.getClinicalFindings(),
                record.getDiagnosis(),
                record.getTreatmentPlan(),
                record.getDoctorNote(),
                record.getFollowUpDate(),
                record.getFollowUpNote(),
                record.getVoiceInputTranscript(),
                record.getAiSummary(),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }
}
