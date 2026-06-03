package com.clinicmanagement.doctorleave.dto;

import com.clinicmanagement.doctorleave.DoctorLeaveRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record DoctorLeaveRequestResponse(
        Long id,
        Long doctorId,
        String doctorName,
        String doctorCode,
        String requestType,
        LocalDate leaveDate,
        LocalTime startTime,
        LocalTime endTime,
        String reason,
        String status,
        String adminComment,
        String approvedByName,
        LocalDateTime approvedAt,
        LocalDateTime createdAt
) {
    public static DoctorLeaveRequestResponse from(DoctorLeaveRequest e) {
        return new DoctorLeaveRequestResponse(
                e.getId(),
                e.getDoctor().getDoctorId(),
                e.getDoctor().getUser().getFullName(),
                e.getDoctor().getDoctorCode(),
                e.getRequestType().name(),
                e.getLeaveDate(),
                e.getStartTime(),
                e.getEndTime(),
                e.getReason(),
                e.getStatus().name(),
                e.getAdminComment(),
                e.getApprovedBy() != null ? e.getApprovedBy().getFullName() : null,
                e.getApprovedAt(),
                e.getCreatedAt()
        );
    }
}
