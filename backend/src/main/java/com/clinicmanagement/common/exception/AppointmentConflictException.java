package com.clinicmanagement.common.exception;

import com.clinicmanagement.doctorleave.dto.ConflictingAppointmentDTO;

import java.util.List;

/**
 * Thrown when a doctor's leave request overlaps with existing active
 * appointments (PENDING_PAYMENT / CONFIRMED / CHECKED_IN / PAYMENT_DUE).
 * Carries the full list of conflicting appointments so the frontend
 * can display them in a table.
 */
public class AppointmentConflictException extends RuntimeException {

    private final List<ConflictingAppointmentDTO> conflicts;

    public AppointmentConflictException(String message, List<ConflictingAppointmentDTO> conflicts) {
        super(message);
        this.conflicts = conflicts;
    }

    public List<ConflictingAppointmentDTO> getConflicts() {
        return conflicts;
    }
}
