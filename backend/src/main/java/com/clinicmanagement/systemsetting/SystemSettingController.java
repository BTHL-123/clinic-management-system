package com.clinicmanagement.systemsetting;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.systemsetting.dto.SystemSettingRequest;
import com.clinicmanagement.systemsetting.dto.SystemSettingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
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
public class SystemSettingController {
    private final SystemSettingService systemSettingService;

    @GetMapping
    public ApiResponse<PageResponse<SystemSettingResponse>> getSystemSettings(Pageable pageable) {
        return ApiResponse.success(PageResponse.from(systemSettingService.getSystemSettings(pageable)));
    }

    @GetMapping("/{settingKey}")
    public ApiResponse<SystemSettingResponse> getByKey(@PathVariable String settingKey) {
        return ApiResponse.success(systemSettingService.getByKey(settingKey));
    }

    @PutMapping("/{settingKey}")
    public ApiResponse<SystemSettingResponse> upsert(
            @PathVariable String settingKey,
            @RequestBody SystemSettingRequest request
    ) {
        return ApiResponse.success(systemSettingService.upsert(settingKey, request));
    }

    @DeleteMapping("/{settingKey}")
    public ApiResponse<Void> delete(@PathVariable String settingKey) {
        systemSettingService.delete(settingKey);
        return ApiResponse.success(null);
    }
}
