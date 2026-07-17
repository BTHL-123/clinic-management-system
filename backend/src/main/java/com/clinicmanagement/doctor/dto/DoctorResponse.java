package com.clinicmanagement.doctor.dto;

import com.clinicmanagement.doctor.Doctor;

public record DoctorResponse(
        Long doctorId,
        Long userId,
        String fullName,
        String avatarUrl,
        Long departmentId,
        String departmentName,
        String doctorCode,
        String degree,
        String specialization,
        Integer yearsOfExperience,
        Integer yearOfBirth,
        String hometown,
        String biography,
        java.math.BigDecimal consultationFee,
        String status
) {
    public static DoctorResponse from(Doctor d) {
        return new DoctorResponse(
                d.getDoctorId(),
                d.getUser().getUserId(),
                d.getUser().getFullName(),
                d.getUser().getAvatarUrl(),
                d.getDepartment().getDepartmentId(),
                d.getDepartment().getDepartmentName(),
                d.getDoctorCode(),
                d.getDegree(),
                d.getSpecialization(),
                d.getYearsOfExperience(),
                d.getYearOfBirth(),
                d.getHometown(),
                d.getBiography(),
                d.getConsultationFee(),
                d.getStatus()
        );
    }
}
