package com.clinicmanagement.doctorleave.dto;

import com.clinicmanagement.appointment.Appointment;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Read-only DTO returned to the frontend when a leave request is blocked
 * by existing active appointments.
 */
public record ConflictingAppointmentDTO(
        Long   appointmentId,
        String appointmentCode,
        String patientName,
        String patientPhone,
        LocalDate appointmentDate,
        LocalTime startTime,
        String status
) {
    public static ConflictingAppointmentDTO from(Appointment a) {
        String patientName  = a.getPatient() != null ? a.getPatient().getFullName() : "—";
        String patientPhone = a.getPatient() != null ? a.getPatient().getPhone()    : "—";
        return new ConflictingAppointmentDTO(
                a.getAppointmentId(),
                a.getAppointmentCode(),
                patientName,
                patientPhone,
                a.getAppointmentDate(),
                a.getStartTime(),
                a.getStatus()
        );
    }
}
