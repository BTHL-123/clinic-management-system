package com.clinicmanagement.appointment.dto;

import java.time.LocalDate;

public record CreateAppointmentRequest(
    Long slotId,
    String fullName,
    String phone,
    String email,
    String gender,
    LocalDate dateOfBirth,
    String reasonForVisit,
    String bookingType
) {}
