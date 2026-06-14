package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorScheduleRequest(
        @NotNull Long doctorId,
        @NotNull LocalDate workDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Integer maxPatients,
        Integer slotDurationMinutes
) {}
