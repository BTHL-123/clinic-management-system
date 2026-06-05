package com.clinicmanagement.systemsetting;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.systemsetting.dto.SystemSettingRequest;
import com.clinicmanagement.systemsetting.dto.SystemSettingResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/system-settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class SystemSettingController {
    private final SystemSettingService systemSettingService;

    @GetMapping
    public ApiResponse<PageResponse<SystemSettingResponse>> getSystemSettings(Pageable pageable) {
        return ApiResponse.success(PageResponse.from(systemSettingService.getSystemSettings(pageable)));
    }

    @GetMapping("/{settingKey}")
    public ApiResponse<SystemSettingResponse> getByKey(
            @PathVariable
            @NotBlank(message = "Khóa cấu hình không được để trống")
            @Size(max = 100, message = "Khóa cấu hình không được vượt quá 100 ký tự")
            @Pattern(
                    regexp = "^[a-zA-Z0-9._-]+$",
                    message = "Khóa cấu hình chỉ được chứa chữ, số, dấu chấm, gạch ngang hoặc gạch dưới"
            )
            String settingKey
    ) {
        return ApiResponse.success(systemSettingService.getByKey(settingKey));
    }

    @PutMapping("/{settingKey}")
    public ApiResponse<SystemSettingResponse> upsert(
            @PathVariable
            @NotBlank(message = "Khóa cấu hình không được để trống")
            @Size(max = 100, message = "Khóa cấu hình không được vượt quá 100 ký tự")
            @Pattern(
                    regexp = "^[a-zA-Z0-9._-]+$",
                    message = "Khóa cấu hình chỉ được chứa chữ, số, dấu chấm, gạch ngang hoặc gạch dưới"
            )
            String settingKey,
            @Valid @RequestBody SystemSettingRequest request
    ) {
        return ApiResponse.success(systemSettingService.upsert(settingKey, request));
    }

    @DeleteMapping("/{settingKey}")
    public ApiResponse<Void> delete(
            @PathVariable
            @NotBlank(message = "Khóa cấu hình không được để trống")
            @Size(max = 100, message = "Khóa cấu hình không được vượt quá 100 ký tự")
            @Pattern(
                    regexp = "^[a-zA-Z0-9._-]+$",
                    message = "Khóa cấu hình chỉ được chứa chữ, số, dấu chấm, gạch ngang hoặc gạch dưới"
            )
            String settingKey
    ) {
        systemSettingService.delete(settingKey);
        return ApiResponse.success(null);
    }
}
