package com.clinicmanagement.notification;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.notification.dto.NotificationResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    PageResponse<NotificationResponse> getMyNotifications(Long userId, Pageable pageable);
    long getUnreadCount(Long userId);
    void markAsRead(Long id, Long userId);
    void markAllAsRead(Long userId);
    void createNotification(Long userId, String title, String message, String type);
}
