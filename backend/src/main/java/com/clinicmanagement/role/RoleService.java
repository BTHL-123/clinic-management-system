package com.clinicmanagement.role;

import com.clinicmanagement.permission.Permission;
import com.clinicmanagement.permission.PermissionRepository;
import com.clinicmanagement.role.dto.AssignPermissionsRequest;
import com.clinicmanagement.role.dto.CreateRoleRequest;
import com.clinicmanagement.role.dto.RoleResponse;
import com.clinicmanagement.role.dto.UpdateRoleRequest;
import java.util.HashSet;
import java.util.List;

public interface RoleService {

    List<RoleResponse> getRoles();

    RoleResponse createRole(CreateRoleRequest request);

    RoleResponse updateRole(Long roleId, UpdateRoleRequest request);

    void deleteRole(Long roleId);

    RoleResponse assignPermissions(Long roleId, AssignPermissionsRequest request);
}

