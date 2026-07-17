package com.clinicmanagement.appointment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record WalkInAppointmentResponse(
        Long appointmentId,
        String appointmentCode,
        Long patientId,
        String patientName,
        String patientPhone,
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
        Integer queueNumber
) {}
