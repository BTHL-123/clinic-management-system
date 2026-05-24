package com.clinicmanagement.aichat.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAiChatSessionRequest(
        @NotBlank(message = "Loại phiên chat không được để trống")
        String sessionType
) {}
