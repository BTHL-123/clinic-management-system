package com.clinicmanagement.appointment;

public enum AppointmentCancellationActor {
    PATIENT,
    DOCTOR,
    STAFF;

    public boolean isClinicInitiated() {
        return this != PATIENT;
    }
}
