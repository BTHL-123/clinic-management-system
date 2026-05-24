package com.clinicmanagement.medicalrecord.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateMedicalRecordRequest(
        @NotNull(message = "consultationId không được để trống")
        Long consultationId,

        @NotNull(message = "patientId không được để trống")
        Long patientId,

        @NotNull(message = "doctorId không được để trống")
        Long doctorId,

        String symptoms,
        String clinicalFindings,
        String diagnosis,
        String treatmentPlan,
        String doctorNote,
        LocalDate followUpDate,
        String followUpNote
) {}
