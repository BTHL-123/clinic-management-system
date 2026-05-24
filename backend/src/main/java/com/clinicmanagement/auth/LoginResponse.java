package com.clinicmanagement.auth;

import com.clinicmanagement.user.dto.UserSummaryResponse;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserSummaryResponse user
) {
}
