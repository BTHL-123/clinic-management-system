package com.clinicmanagement.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 150) String fullName,
        @Size(max = 20) String phone,
        @Size(max = 500) String avatarUrl,
        String status
) {
}
