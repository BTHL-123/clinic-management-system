package com.clinicmanagement.user.dto;

import java.util.List;

public record UserSummaryResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String avatarUrl,
        String status,
        List<String> roles
) {
}
