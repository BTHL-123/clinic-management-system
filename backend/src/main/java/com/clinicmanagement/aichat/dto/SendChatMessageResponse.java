package com.clinicmanagement.aichat.dto;

public record SendChatMessageResponse(
        MessageDetail patientMessage,
        MessageDetail aiMessage
) {
    public record MessageDetail(
            Long messageId,
            String messageText,
            String senderType,
            java.time.LocalDateTime createdAt
    ) {}
}
