package com.clinicmanagement.role.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AssignPermissionsRequest(@NotNull List<Long> permissionIds) {
}
