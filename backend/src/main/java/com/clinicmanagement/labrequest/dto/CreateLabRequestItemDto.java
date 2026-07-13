package com.clinicmanagement.labrequest.dto;

import jakarta.validation.constraints.NotNull;

public record CreateLabRequestItemDto(
        @NotNull(message = "labTestId không được để trống")
        Long labTestId,
        
        String note
) {}
