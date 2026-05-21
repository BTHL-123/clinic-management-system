package com.clinicmanagement.doctor;

public record DoctorResponse(
        Long doctorId,
        Long userId,
        String fullName,
        Long departmentId,
        String departmentName,
        String doctorCode,
        String degree,
        String specialization,
        Integer yearsOfExperience,
        String biography,
        java.math.BigDecimal consultationFee,
        String status
) {
    public static DoctorResponse from(Doctor d) {
        return new DoctorResponse(
                d.getDoctorId(),
                d.getUser().getUserId(),
                d.getUser().getFullName(),
                d.getDepartment().getDepartmentId(),
                d.getDepartment().getDepartmentName(),
                d.getDoctorCode(),
                d.getDegree(),
                d.getSpecialization(),
                d.getYearsOfExperience(),
                d.getBiography(),
                d.getConsultationFee(),
                d.getStatus()
        );
    }
}
