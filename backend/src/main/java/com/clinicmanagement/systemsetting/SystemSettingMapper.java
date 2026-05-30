package com.clinicmanagement.systemsetting;

import com.clinicmanagement.systemsetting.dto.SystemSettingResponse;

public final class SystemSettingMapper {
    private SystemSettingMapper() {
    }

    public static SystemSettingResponse toResponse(SystemSetting setting) {
        return new SystemSettingResponse(
                setting.getSettingId(),
                setting.getSettingKey(),
                setting.getSettingValue(),
                setting.getDescription(),
                setting.getUpdatedAt()
        );
    }
}
