package com.clinicmanagement.user.dto;

import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public record CreateDoctorProfileRequest(
        Long departmentId,
        String doctorCode,
        String degree,
        String specialization,
        Integer yearsOfExperience,
        String biography,
        BigDecimal consultationFee,
        @Pattern(regexp = "ACTIVE|ON_LEAVE|INACTIVE", message = "Trạng thái không hợp lệ")
        String status
) {
}
