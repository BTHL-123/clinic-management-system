package com.clinicmanagement.systemsetting;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.systemsetting.dto.SystemSettingRequest;
import com.clinicmanagement.systemsetting.dto.SystemSettingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {
    private final SystemSettingRepository systemSettingRepository;

    @Override
    public Page<SystemSettingResponse> getSystemSettings(Pageable pageable) {
        return systemSettingRepository.findAll(pageable).map(SystemSettingMapper::toResponse);
    }

    @Override
    public SystemSettingResponse getByKey(String settingKey) {
        return SystemSettingMapper.toResponse(findByKey(settingKey));
    }

    @Transactional
    @Override
    public SystemSettingResponse upsert(String settingKey, SystemSettingRequest request) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(settingKey).orElseGet(() -> {
            SystemSetting created = new SystemSetting();
            created.setSettingKey(settingKey);
            return created;
        });
        setting.setSettingValue(request.settingValue());
        setting.setDescription(request.description());
        return SystemSettingMapper.toResponse(systemSettingRepository.save(setting));
    }

    @Transactional
    @Override
    public void delete(String settingKey) {
        if (!systemSettingRepository.existsBySettingKey(settingKey)) {
            throw new ResourceNotFoundException("System setting not found");
        }
        systemSettingRepository.deleteBySettingKey(settingKey);
    }

    private SystemSetting findByKey(String settingKey) {
        return systemSettingRepository.findBySettingKey(settingKey)
                .orElseThrow(() -> new ResourceNotFoundException("System setting not found"));
    }
}

