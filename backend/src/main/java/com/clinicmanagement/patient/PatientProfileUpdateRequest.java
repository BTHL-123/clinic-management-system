package com.clinicmanagement.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record PatientProfileUpdateRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        String fullName,

        @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
        String gender,

        LocalDate dateOfBirth,

        String phone,

        String email,

        String address,

        String identityNumber,

        String insuranceNumber,

        String emergencyContactName,

        String emergencyContactPhone,

        String bloodType,

        String allergies,

        String medicalHistory
) {
}
