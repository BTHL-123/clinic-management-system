package com.clinicmanagement.systemsetting;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    Optional<SystemSetting> findBySettingKey(String settingKey);

    boolean existsBySettingKey(String settingKey);

    void deleteBySettingKey(String settingKey);
}
