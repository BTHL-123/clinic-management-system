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
        LocalDate queueDate,
        String priorityLevel,
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
        var appt = q.getAppointment();
        var patient = q.getPatient();
        var doctor = q.getDoctor();

        return new QueueTicketResponse(
                q.getQueueTicketId(),
                q.getQueueNumber(),
                q.getStatus(),
                appt != null ? appt.getAppointmentId() : null,
                appt != null ? appt.getAppointmentCode() : null,
                patient != null ? patient.getPatientId() : null,
                patient != null ? patient.getFullName() : null,
                patient != null ? patient.getPhone() : null,
                doctor != null ? doctor.getDoctorId() : null,
                doctor != null && doctor.getUser() != null ? doctor.getUser().getFullName() : null,
                appt != null ? appt.getAppointmentDate() : null,
                appt != null ? appt.getStartTime() : null,
                appt != null ? appt.getEndTime() : null,
                q.getQueueDate(),
                q.getPriorityLevel(),
                q.getEstimatedWaitMinutes(),
                q.getCheckedInAt(),
                q.getCalledAt(),
                q.getCompletedAt(),
                consultationId
        );
    }
}
