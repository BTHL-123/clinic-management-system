package com.clinicmanagement.patient.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record PatientProfileUpdateRequest(
        @NotBlank(message = "Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        String fullName,

        @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giá»›i tÃ­nh pháº£i lÃ  MALE, FEMALE hoáº·c OTHER")
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


