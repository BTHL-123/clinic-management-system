package com.clinicmanagement.consultation.dto;

import com.clinicmanagement.consultation.ConsultationSession;
import java.time.LocalDateTime;

public record ConsultationResponse(
        Long consultationId,
        Long appointmentId,
        Long patientId,
        Long doctorId,
        String status,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ConsultationResponse from(ConsultationSession session) {
        return new ConsultationResponse(
                session.getConsultationId(),
                session.getAppointmentId(),
                session.getPatientId(),
                session.getDoctorId(),
                session.getStatus(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
