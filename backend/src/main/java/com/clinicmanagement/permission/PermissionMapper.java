package com.clinicmanagement.permission;

import com.clinicmanagement.permission.dto.PermissionResponse;

public final class PermissionMapper {
    private PermissionMapper() {
    }

    public static PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getPermissionId(),
                permission.getPermissionCode(),
                permission.getDescription()
        );
    }
}
