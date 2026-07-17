package com.clinicmanagement.auditlog;

import com.clinicmanagement.auditlog.dto.AuditLogResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String tableName,
            Pageable pageable
    ) {
        return ApiResponse.success(PageResponse.from(auditLogService.getAuditLogs(userId, action, tableName, pageable)));
    }

    @GetMapping("/{auditLogId}")
    public ApiResponse<AuditLogResponse> getAuditLogById(@PathVariable Long auditLogId) {
        return ApiResponse.success(auditLogService.getAuditLogById(auditLogId));
    }
}
