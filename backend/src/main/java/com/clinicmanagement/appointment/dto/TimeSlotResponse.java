package com.clinicmanagement.appointment.dto;

import java.time.LocalTime;

public record TimeSlotResponse(
        Long slotId,
        Long scheduleId,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        Long appointmentId
) {
    public TimeSlotResponse(Long slotId, Long scheduleId, LocalTime startTime, LocalTime endTime, String status) {
        this(slotId, scheduleId, startTime, endTime, status, null);
    }
}
