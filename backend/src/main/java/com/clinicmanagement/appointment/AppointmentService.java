package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.CreateAppointmentRequest;

public interface AppointmentService {
    AppointmentResponse createAppointment(CreateAppointmentRequest request, Long actorUserId);
}
