package com.clinicmanagement.aichat.dto;

import jakarta.validation.constraints.NotBlank;

public record AiChatMessageRequest(
        @NotBlank(message = "Nội dung tin nhắn không được để trống")
        String messageText
) {}
