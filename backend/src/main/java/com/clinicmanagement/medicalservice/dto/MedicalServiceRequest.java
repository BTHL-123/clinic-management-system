package com.clinicmanagement.medicalservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MedicalServiceRequest(
        @NotBlank(message = "Mã dịch vụ không được để trống")
        String serviceCode,

        @NotBlank(message = "Tên dịch vụ không được để trống")
        String serviceName,

        String serviceType,

        @NotNull(message = "Giá dịch vụ không được để trống")
        @Min(value = 0, message = "Giá dịch vụ không được âm")
        BigDecimal price,

        String description,
        
        String status
) {
}
