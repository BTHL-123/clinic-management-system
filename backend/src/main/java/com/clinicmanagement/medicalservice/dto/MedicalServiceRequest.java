package com.clinicmanagement.medicalservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record MedicalServiceRequest(

        @NotBlank(message = "Mã dịch vụ không được để trống")
        @Size(max = 30, message = "Mã dịch vụ không được vượt quá 30 ký tự")
        String serviceCode,

        @NotBlank(message = "Tên dịch vụ không được để trống")
        @Size(max = 150, message = "Tên dịch vụ không được vượt quá 150 ký tự")
        String serviceName,

        @NotBlank(message = "Loại dịch vụ không được để trống")
        @Pattern(
                regexp = "CONSULTATION|LAB_TEST|PACKAGE|OTHER",
                message = "Loại dịch vụ phải là CONSULTATION, LAB_TEST, PACKAGE hoặc OTHER"
        )
        String serviceType,

        @NotNull(message = "Giá dịch vụ không được để trống")
        @DecimalMin(value = "0.0", message = "Giá dịch vụ phải lớn hơn hoặc bằng 0")
        BigDecimal price,

        String description,

        @Pattern(
                regexp = "ACTIVE|INACTIVE",
                message = "Trạng thái phải là ACTIVE hoặc INACTIVE"
        )
        String status
) {
}
