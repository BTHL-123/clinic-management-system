package com.clinicmanagement.appointment.dto;

import com.clinicmanagement.appointment.QueueTicket;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record QueueTicketResponse(
        Long queueTicketId,
        Integer queueNumber,
        String queueStatus,
        Long appointmentId,
        String appointmentCode,
        Long patientId,
        String patientName,
        String patientPhone,
        Long doctorId,
        String doctorName,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        LocalDateTime checkedInAt,
        LocalDateTime calledAt,
        LocalDateTime completedAt,
        Long consultationId // Giữ lại trường này của ông cho Module 40
) {
    public static QueueTicketResponse from(QueueTicket q) {
        return from(q, null);
    }

    public static QueueTicketResponse from(QueueTicket q, Long consultationId) {
        return new QueueTicketResponse(
                q.getQueueTicketId(),
                q.getQueueNumber(),
                q.getStatus(), 
                q.getAppointment() != null ? q.getAppointment().getAppointmentId() : null,
                null, 
                q.getPatient() != null ? q.getPatient().getPatientId() : null,
                q.getPatient() != null ? q.getPatient().getFullName() : null,
                null, 
                q.getDoctor() != null ? q.getDoctor().getDoctorId() : null,
                q.getDoctor() != null && q.getDoctor().getUser() != null ? q.getDoctor().getUser().getFullName() : null, 
                q.getQueueDate(), 
                null, 
                null, 
                q.getCheckedInAt(),
                q.getCalledAt(),
                q.getCompletedAt(),
                consultationId
        );
    }
}