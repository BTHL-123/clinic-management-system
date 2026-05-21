package com.clinicmanagement.patient;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientResponse(
        Long patientId,
        Long userId,
        String userName,
        String patientCode,
        String fullName,
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
        String medicalHistory,
        LocalDateTime createdAt
) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(
                p.getPatientId(),
                p.getUser() != null ? p.getUser().getUserId() : null,
                p.getUser() != null ? p.getUser().getFullName() : null,
                p.getPatientCode(),
                p.getFullName(),
                p.getGender(),
                p.getDateOfBirth(),
                p.getPhone(),
                p.getEmail(),
                p.getAddress(),
                p.getIdentityNumber(),
                p.getInsuranceNumber(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone(),
                p.getBloodType(),
                p.getAllergies(),
                p.getMedicalHistory(),
                p.getCreatedAt()
        );
    }
}
