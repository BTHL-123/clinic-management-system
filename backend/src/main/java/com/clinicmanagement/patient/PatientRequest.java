package com.clinicmanagement.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PatientRequest(
        Long userId,

        @NotBlank(message = "Mã bệnh nhân không được để trống")
        @Size(max = 30, message = "Mã bệnh nhân không được vượt quá 30 ký tự")
        String patientCode,

        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
        String fullName,

        @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
        String gender,

        LocalDate dateOfBirth,

        @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
        String phone,

        @Email(message = "Email không hợp lệ")
        String email,

        String address,

        @Size(max = 30, message = "Số CMND/CCCD không được vượt quá 30 ký tự")
        String identityNumber,

        @Size(max = 50, message = "Mã thẻ BHYT không được vượt quá 50 ký tự")
        String insuranceNumber,

        @Size(max = 150, message = "Tên người liên hệ khẩn cấp không được vượt quá 150 ký tự")
        String emergencyContactName,

        @Size(max = 20, message = "Số điện thoại khẩn cấp không được vượt quá 20 ký tự")
        String emergencyContactPhone,

        @Size(max = 10, message = "Nhóm máu không được vượt quá 10 ký tự")
        String bloodType,

        String allergies,

        String medicalHistory
) {
}
