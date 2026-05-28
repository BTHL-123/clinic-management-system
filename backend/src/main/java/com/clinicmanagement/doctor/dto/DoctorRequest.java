package com.clinicmanagement.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record DoctorRequest(
        @NotNull(message = "ID người dùng không được để trống")
        Long userId,

        @NotNull(message = "ID chuyên khoa không được để trống")
        Long departmentId,

        @NotBlank(message = "Mã bác sĩ không được để trống")
        String doctorCode,

        String degree,

        String specialization,

        Integer yearsOfExperience,

        String biography,

        java.math.BigDecimal consultationFee,

        @Pattern(regexp = "ACTIVE|ON_LEAVE|INACTIVE", message = "Trạng thái không hợp lệ")
        String status
) {
}
