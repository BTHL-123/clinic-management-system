package com.clinicmanagement.user;

import com.clinicmanagement.role.Role;
import com.clinicmanagement.user.dto.UserSummaryResponse;
import java.util.Comparator;

public final class UserMapper {
    private UserMapper() {
    }

    public static UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getStatus(),
                user.getRoles().stream()
                        .map(Role::getRoleName)
                        .sorted(Comparator.naturalOrder())
                        .toList()
        );
    }
}
