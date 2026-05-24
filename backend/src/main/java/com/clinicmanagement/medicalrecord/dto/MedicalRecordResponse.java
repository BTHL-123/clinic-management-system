package com.clinicmanagement.medicalrecord.dto;

import com.clinicmanagement.medicalrecord.MedicalRecord;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MedicalRecordResponse(
        Long medicalRecordId,
        Long consultationId,
        Long patientId,
        Long doctorId,
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
        return new MedicalRecordResponse(
                record.getMedicalRecordId(),
                record.getConsultationId(),
                record.getPatientId(),
                record.getDoctorId(),
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
