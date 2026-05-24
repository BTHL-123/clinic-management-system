package com.clinicmanagement.systemsetting.dto;

public record SystemSettingRequest(
        String settingValue,
        String description
) {
}
