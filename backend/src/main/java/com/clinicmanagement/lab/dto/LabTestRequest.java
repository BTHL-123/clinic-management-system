package com.clinicmanagement.lab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record LabTestRequest(
        @NotBlank(message = "testCode không được để trống")
        String testCode,

        @NotBlank(message = "testName không được để trống")
        String testName,

        String description,

        @NotNull(message = "price không được để trống")
        BigDecimal price,

        String status
) {}
