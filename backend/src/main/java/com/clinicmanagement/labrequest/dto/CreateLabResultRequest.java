package com.clinicmanagement.labrequest.dto;

import jakarta.validation.constraints.NotNull;

public record CreateLabResultRequest(
        @NotNull(message = "labRequestItemId không được để trống")
        Long labRequestItemId,

        String resultValue,
        String normalRange,
        String resultUnit,
        String conclusion,
        String resultFileUrl
) {}
