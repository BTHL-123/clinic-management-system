package com.clinicmanagement.auditlog;

import com.clinicmanagement.auditlog.dto.AuditLogResponse;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;

    @Override
    public Page<AuditLogResponse> getAuditLogs(Long userId, String action, String tableName, Pageable pageable) {
        return auditLogRepository.findAll(buildSpecification(userId, action, tableName), pageable)
                .map(AuditLogResponse::from);
    }

    @Override
    public AuditLogResponse getAuditLogById(Long auditLogId) {
        return auditLogRepository.findById(auditLogId)
                .map(AuditLogResponse::from)
                .orElseThrow(() -> new com.clinicmanagement.common.exception.ResourceNotFoundException("Audit log not found"));
    }

    private Specification<AuditLog> buildSpecification(Long userId, String action, String tableName) {
        return (root, query, criteriaBuilder) -> {
            var predicates = new ArrayList<Predicate>();

            if (userId != null) {
                predicates.add(criteriaBuilder.equal(root.get("user").get("userId"), userId));
            }

            String normalizedAction = blankToNull(action);
            if (normalizedAction != null) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("action")),
                        "%" + normalizedAction.toLowerCase() + "%"
                ));
            }

            String normalizedTableName = blankToNull(tableName);
            if (normalizedTableName != null) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("tableName")),
                        "%" + normalizedTableName.toLowerCase() + "%"
                ));
            }

            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("user", JoinType.LEFT);
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
