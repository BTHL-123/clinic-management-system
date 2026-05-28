package com.clinicmanagement.auditlog;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;

    @Override
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    @Override
    public AuditLog getAuditLogById(Long auditLogId) {
        return auditLogRepository.findById(auditLogId)
                .orElseThrow(() -> new com.clinicmanagement.common.exception.ResourceNotFoundException("Audit log not found"));
    }
}

