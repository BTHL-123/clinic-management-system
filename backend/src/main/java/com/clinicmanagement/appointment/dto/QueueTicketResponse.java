package com.clinicmanagement.appointment.dto;

import com.clinicmanagement.appointment.QueueTicket;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record QueueTicketResponse(
        Long queueTicketId,
        Long appointmentId,
        Long patientId,
        String patientName,
        Long doctorId,
        Long departmentId,
        LocalDate queueDate,
        Integer queueNumber,
        String priorityLevel,
        String status,
        Integer estimatedWaitMinutes,
        LocalDateTime checkedInAt,
        LocalDateTime calledAt,
        LocalDateTime completedAt,
        Long consultationId
) {
    public static QueueTicketResponse from(QueueTicket q) {
        return from(q, null);
    }

    public static QueueTicketResponse from(QueueTicket q, Long consultationId) {
        return new QueueTicketResponse(
                q.getQueueTicketId(),
                q.getAppointment() != null ? q.getAppointment().getAppointmentId() : null,
                q.getPatient() != null ? q.getPatient().getPatientId() : null,
                q.getPatient() != null ? q.getPatient().getFullName() : null,
                q.getDoctor() != null ? q.getDoctor().getDoctorId() : null,
                q.getDepartment() != null ? q.getDepartment().getDepartmentId() : null,
                q.getQueueDate(),
                q.getQueueNumber(),
                q.getPriorityLevel(),
                q.getStatus(),
                q.getEstimatedWaitMinutes(),
                q.getCheckedInAt(),
                q.getCalledAt(),
                q.getCompletedAt(),
                consultationId
        );
    }
}
