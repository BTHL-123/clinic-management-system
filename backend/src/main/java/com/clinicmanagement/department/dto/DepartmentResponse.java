package com.clinicmanagement.department.dto;

import com.clinicmanagement.department.Department;
import java.time.LocalDateTime;

public record DepartmentResponse(
        Long departmentId,
        String departmentName,
        String description,
        String status,
        LocalDateTime createdAt
) {
    public static DepartmentResponse from(Department dept) {
        return new DepartmentResponse(
                dept.getDepartmentId(),
                dept.getDepartmentName(),
                dept.getDescription(),
                dept.getStatus(),
                dept.getCreatedAt()
        );
    }
}
