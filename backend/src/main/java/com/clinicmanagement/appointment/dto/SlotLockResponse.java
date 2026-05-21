package com.clinicmanagement.appointment.dto;

import java.time.LocalDateTime;

public record SlotLockResponse(
        Long slotId,
        Long scheduleId,
        String startTime,
        String endTime,
        LocalDateTime lockedUntil,
        Long lockedByPatientId
) {}
