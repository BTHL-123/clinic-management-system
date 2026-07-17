package com.clinicmanagement.permission;

import com.clinicmanagement.permission.dto.PermissionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {
    private final PermissionRepository permissionRepository;

    @Override
    public List<PermissionResponse> getPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionMapper::toResponse)
                .toList();
    }
}

