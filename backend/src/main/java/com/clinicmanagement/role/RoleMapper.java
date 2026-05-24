package com.clinicmanagement.role;

import com.clinicmanagement.permission.Permission;
import com.clinicmanagement.role.dto.RoleResponse;
import java.util.Comparator;

public final class RoleMapper {
    private RoleMapper() {
    }

    public static RoleResponse toResponse(Role role) {
        return new RoleResponse(
                role.getRoleId(),
                role.getRoleName(),
                role.getDescription(),
                role.getPermissions().stream()
                        .map(Permission::getPermissionCode)
                        .sorted(Comparator.naturalOrder())
                        .toList()
        );
    }
}
