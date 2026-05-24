package com.clinicmanagement.role;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.role.dto.AssignPermissionsRequest;
import com.clinicmanagement.role.dto.CreateRoleRequest;
import com.clinicmanagement.role.dto.RoleResponse;
import com.clinicmanagement.role.dto.UpdateRoleRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public ApiResponse<List<RoleResponse>> getRoles() {
        return ApiResponse.success(roleService.getRoles());
    }

    @PostMapping
    public ApiResponse<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ApiResponse.success("Role created successfully", roleService.createRole(request));
    }

    @PutMapping("/{roleId}")
    public ApiResponse<RoleResponse> updateRole(
            @PathVariable Long roleId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ApiResponse.success(roleService.updateRole(roleId, request));
    }

    @DeleteMapping("/{roleId}")
    public ApiResponse<Void> deleteRole(@PathVariable Long roleId) {
        roleService.deleteRole(roleId);
        return ApiResponse.success(null);
    }

    @PutMapping("/{roleId}/permissions")
    public ApiResponse<RoleResponse> assignPermissions(
            @PathVariable Long roleId,
            @Valid @RequestBody AssignPermissionsRequest request
    ) {
        return ApiResponse.success(roleService.assignPermissions(roleId, request));
    }
}
