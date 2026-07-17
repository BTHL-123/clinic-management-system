package com.clinicmanagement.appointment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AppointmentResponse(
        Long appointmentId,
        String appointmentCode,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String doctorSpecialization,
        Long departmentId,
        String departmentName,
        Long slotId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String bookingType,
        String reasonForVisit,
        String initialSymptoms,
        String status,
        BigDecimal depositAmount,
        String cancellationReason,
        LocalDateTime cancelledAt,
        String patientPhone,
        java.time.LocalDateTime checkedInAt,
        Integer queueNumber,
        String queueStatus,
        Boolean hasReviewed,
        Long queueTicketId
) {}
