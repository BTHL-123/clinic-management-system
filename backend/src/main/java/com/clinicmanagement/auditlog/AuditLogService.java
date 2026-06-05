package com.clinicmanagement.auditlog;

import com.clinicmanagement.auditlog.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    Page<AuditLogResponse> getAuditLogs(Long userId, String action, String tableName, Pageable pageable);

    AuditLogResponse getAuditLogById(Long auditLogId);
}
