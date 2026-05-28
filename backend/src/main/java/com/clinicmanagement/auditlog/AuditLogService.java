package com.clinicmanagement.auditlog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    Page<AuditLog> getAuditLogs(Pageable pageable);

    AuditLog getAuditLogById(Long auditLogId);
}
