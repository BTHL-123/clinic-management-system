package com.clinicmanagement.prescription.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreatePrescriptionRequest(
        @NotNull(message = "consultationId is required")
        Long consultationId,

        @NotNull(message = "patientId is required")
        Long patientId,

        @NotNull(message = "doctorId is required")
        Long doctorId,

        String doctorNote,

        @NotEmpty(message = "At least one medicine is required")
        @Valid
        List<PrescriptionItemRequest> items
) {}
