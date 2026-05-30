package com.clinicmanagement.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        String title,
        String message,
        String type,
        boolean isRead,
        LocalDateTime createdAt
) {}
