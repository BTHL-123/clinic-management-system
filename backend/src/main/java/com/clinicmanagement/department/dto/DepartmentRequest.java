package com.clinicmanagement.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DepartmentRequest(

        @NotBlank(message = "Tên chuyên khoa không được để trống")
        @Size(max = 150, message = "Tên chuyên khoa không được vượt quá 150 ký tự")
        String departmentName,

        String description,

        @Pattern(
                regexp = "ACTIVE|INACTIVE",
                message = "Trạng thái phải là ACTIVE hoặc INACTIVE"
        )
        String status
) {
}
