package com.clinicmanagement.medicalrecord.dto;

import java.time.LocalDate;

public record UpdateMedicalRecordRequest(
        String symptoms,
        String clinicalFindings,
        String diagnosis,
        String treatmentPlan,
        String doctorNote,
        LocalDate followUpDate,
        String followUpNote
) {}
