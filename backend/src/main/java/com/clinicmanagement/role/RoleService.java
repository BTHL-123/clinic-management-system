package com.clinicmanagement.role;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.permission.Permission;
import com.clinicmanagement.permission.PermissionRepository;
import com.clinicmanagement.role.dto.AssignPermissionsRequest;
import com.clinicmanagement.role.dto.CreateRoleRequest;
import com.clinicmanagement.role.dto.RoleResponse;
import com.clinicmanagement.role.dto.UpdateRoleRequest;
import java.util.HashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles() {
        return roleRepository.findAll().stream().map(RoleMapper::toResponse).toList();
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.existsByRoleName(request.roleName())) {
            throw new BusinessException("Role already exists");
        }
        Role role = new Role();
        role.setRoleName(request.roleName());
        role.setDescription(request.description());
        return RoleMapper.toResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse updateRole(Long roleId, UpdateRoleRequest request) {
        Role role = findRole(roleId);
        roleRepository.findByRoleName(request.roleName())
                .filter(existing -> !existing.getRoleId().equals(roleId))
                .ifPresent(existing -> {
                    throw new BusinessException("Role already exists");
                });
        role.setRoleName(request.roleName());
        role.setDescription(request.description());
        return RoleMapper.toResponse(role);
    }

    @Transactional
    public void deleteRole(Long roleId) {
        if (!roleRepository.existsById(roleId)) {
            throw new ResourceNotFoundException("Role not found");
        }
        roleRepository.deleteById(roleId);
    }

    @Transactional
    public RoleResponse assignPermissions(Long roleId, AssignPermissionsRequest request) {
        Role role = findRole(roleId);
        List<Permission> permissions = permissionRepository.findByPermissionIdIn(request.permissionIds());
        if (permissions.size() != request.permissionIds().size()) {
            throw new ResourceNotFoundException("One or more permissions were not found");
        }
        role.setPermissions(new HashSet<>(permissions));
        return RoleMapper.toResponse(role);
    }

    private Role findRole(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
    }
}
