package com.clinicmanagement.permission;

import com.clinicmanagement.permission.dto.PermissionResponse;
import java.util.List;

public interface PermissionService {

    List<PermissionResponse> getPermissions();
}

