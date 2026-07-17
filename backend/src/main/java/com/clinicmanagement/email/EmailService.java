package com.clinicmanagement.email;

import com.clinicmanagement.appointment.Appointment;

public interface EmailService {
    void sendBookingConfirmation(Appointment appointment);
    void sendAppointmentReminder(Appointment appointment);
}
