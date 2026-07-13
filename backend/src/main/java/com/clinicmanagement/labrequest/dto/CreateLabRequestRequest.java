package com.clinicmanagement.labrequest.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateLabRequestRequest(
        @NotNull(message = "consultationId không được để trống")
        Long consultationId,

        @NotNull(message = "patientId không được để trống")
        Long patientId,

        @NotNull(message = "doctorId không được để trống")
        Long doctorId,

        @NotEmpty(message = "Phải chọn ít nhất một loại xét nghiệm")
        List<CreateLabRequestItemDto> items,

        String note
) {}
