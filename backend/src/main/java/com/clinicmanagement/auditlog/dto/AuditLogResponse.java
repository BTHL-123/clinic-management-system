package com.clinicmanagement.auditlog.dto;

import com.clinicmanagement.auditlog.AuditLog;
import com.clinicmanagement.user.User;
import java.time.LocalDateTime;

public record AuditLogResponse(
        Long auditLogId,
        Long userId,
        String userFullName,
        String userEmail,
        String action,
        String tableName,
        Long recordId,
        String oldValue,
        String newValue,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {
    public static AuditLogResponse from(AuditLog auditLog) {
        User user = auditLog.getUser();
        return new AuditLogResponse(
                auditLog.getAuditLogId(),
                user != null ? user.getUserId() : null,
                user != null ? user.getFullName() : null,
                user != null ? user.getEmail() : null,
                auditLog.getAction(),
                auditLog.getTableName(),
                auditLog.getRecordId(),
                auditLog.getOldValue(),
                auditLog.getNewValue(),
                auditLog.getIpAddress(),
                auditLog.getUserAgent(),
                auditLog.getCreatedAt()
        );
    }
}
