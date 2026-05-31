package com.clinicmanagement.prescription.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreatePrescriptionRequest(
        @NotNull(message = "consultationId không được để trống")
        Long consultationId,

        @NotNull(message = "patientId không được để trống")
        Long patientId,

        @NotNull(message = "doctorId không được để trống")
        Long doctorId,

        String doctorNote,

        @NotEmpty(message = "Đơn thuốc phải có ít nhất một loại thuốc")
        @Valid
        List<PrescriptionItemRequest> items
) {}
