package com.clinicmanagement.patient.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PatientRequest(
        Long userId,

        @Pattern(regexp = "SELF|CHILD|PARENT|SPOUSE|OTHER", message = "Mối quan hệ không hợp lệ")
        String relationshipToUser,

        @NotBlank(message = "MÃ£ bá»‡nh nhÃ¢n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        @Size(max = 30, message = "MÃ£ bá»‡nh nhÃ¢n khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 30 kÃ½ tá»±")
        String patientCode,

        @NotBlank(message = "Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        @Size(max = 150, message = "Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 150 kÃ½ tá»±")
        String fullName,

        @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giá»›i tÃ­nh pháº£i lÃ  MALE, FEMALE hoáº·c OTHER")
        String gender,

        LocalDate dateOfBirth,

        @Size(max = 20, message = "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 20 kÃ½ tá»±")
        String phone,

        @Email(message = "Email khÃ´ng há»£p lá»‡")
        String email,

        String address,

        @Size(max = 30, message = "Sá»‘ CMND/CCCD khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 30 kÃ½ tá»±")
        String identityNumber,

        @Size(max = 50, message = "MÃ£ tháº» BHYT khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 50 kÃ½ tá»±")
        String insuranceNumber,

        @Size(max = 150, message = "TÃªn ngÆ°á»i liÃªn há»‡ kháº©n cáº¥p khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 150 kÃ½ tá»±")
        String emergencyContactName,

        @Size(max = 20, message = "Sá»‘ Ä‘iá»‡n thoáº¡i kháº©n cáº¥p khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 20 kÃ½ tá»±")
        String emergencyContactPhone,

        @Size(max = 10, message = "NhÃ³m mÃ¡u khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 10 kÃ½ tá»±")
        String bloodType,

        String allergies,

        String medicalHistory
) {
}


