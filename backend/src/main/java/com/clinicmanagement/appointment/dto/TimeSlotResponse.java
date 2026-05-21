package com.clinicmanagement.appointment.dto;

import java.time.LocalTime;

public record TimeSlotResponse(
        Long slotId,
        Long scheduleId,
        LocalTime startTime,
        LocalTime endTime,
        String status
) {}
