package com.clinicmanagement.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorScheduleResponse(
        Long scheduleId,
        Long doctorId,
        LocalDate workDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer maxPatients,
        String status,
        Integer bookedSlots,
        Integer totalSlots
) {}
