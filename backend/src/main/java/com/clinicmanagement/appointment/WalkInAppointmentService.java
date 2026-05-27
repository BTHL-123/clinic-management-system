package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.WalkInAppointmentRequest;
import com.clinicmanagement.appointment.dto.WalkInAppointmentResponse;

public interface WalkInAppointmentService {
    WalkInAppointmentResponse createWalkIn(WalkInAppointmentRequest request, Long createdByUserId);
}
