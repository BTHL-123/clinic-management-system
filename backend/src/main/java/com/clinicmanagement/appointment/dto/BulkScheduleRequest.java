package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record BulkScheduleRequest(
        @NotNull Long doctorId,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull List<DayOfWeek> daysOfWeek,
        @NotNull LocalDate fromDate,
        @NotNull LocalDate toDate,
        Integer maxPatients,
        Integer slotDurationMinutes
) {}
