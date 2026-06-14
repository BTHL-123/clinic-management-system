package com.clinicmanagement.common.dto;

import com.clinicmanagement.doctorleave.dto.ConflictingAppointmentDTO;

import java.util.List;

/**
 * Wrapper placed in ApiResponse.data when a leave request is rejected
 * due to conflicting appointments.
 */
public record AppointmentConflictPayload(
        List<ConflictingAppointmentDTO> conflictingAppointments
) {}
