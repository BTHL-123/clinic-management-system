package com.clinicmanagement.appointment.dto;

public record GenerateSlotsResponse(
        Long scheduleId,
        Integer generatedSlots
) {}
