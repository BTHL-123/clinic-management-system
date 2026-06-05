package com.clinicmanagement.systemsetting.dto;

import jakarta.validation.constraints.Size;

public record SystemSettingRequest(
        @Size(max = 5000, message = "Giá trị cấu hình không được vượt quá 5000 ký tự")
        String settingValue,

        @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
        String description
) {
}
