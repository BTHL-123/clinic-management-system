package com.clinicmanagement.auditlog;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public AuditLog getAuditLogById(Long auditLogId) {
        return auditLogRepository.findById(auditLogId)
                .orElseThrow(() -> new com.clinicmanagement.common.exception.ResourceNotFoundException("Audit log not found"));
    }
}
