package com.clinicmanagement.permission.dto;

public record PermissionResponse(
        Long permissionId,
        String permissionCode,
        String description
) {
}
