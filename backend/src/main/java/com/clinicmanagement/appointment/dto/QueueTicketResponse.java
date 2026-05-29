package com.clinicmanagement.appointment.dto;

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
        LocalDateTime completedAt
) {}
