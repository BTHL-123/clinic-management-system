package com.clinicmanagement.systemsetting.dto;

import java.time.LocalDateTime;

public record SystemSettingResponse(
        Long settingId,
        String settingKey,
        String settingValue,
        String description,
        LocalDateTime updatedAt
) {
}
