package com.clinicmanagement.systemsetting;

import com.clinicmanagement.systemsetting.dto.SystemSettingRequest;
import com.clinicmanagement.systemsetting.dto.SystemSettingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SystemSettingService {

    Page<SystemSettingResponse> getSystemSettings(Pageable pageable);

    SystemSettingResponse getByKey(String settingKey);

    SystemSettingResponse upsert(String settingKey, SystemSettingRequest request);

    void delete(String settingKey);
}
