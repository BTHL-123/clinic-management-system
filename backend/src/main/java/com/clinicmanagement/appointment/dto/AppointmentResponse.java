package com.clinicmanagement.appointment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
    Long appointmentId,
    String appointmentCode,
    Long patientId,
    String patientName,
    Long doctorId,
    Long departmentId,
    Long slotId,
    LocalDate appointmentDate,
    LocalTime startTime,
    LocalTime endTime,
    String bookingType,
    String reasonForVisit,
    String status,
    BigDecimal depositAmount
) {}
