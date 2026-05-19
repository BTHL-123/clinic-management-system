package com.clinicmanagement.user.dto;

import java.util.List;

public record UserSummaryResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String status,
        List<String> roles
) {
}
