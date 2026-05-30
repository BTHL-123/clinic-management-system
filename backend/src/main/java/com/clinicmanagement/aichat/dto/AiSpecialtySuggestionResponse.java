package com.clinicmanagement.aichat.dto;

public record AiSpecialtySuggestionResponse(
        Long suggestionId,
        Long departmentId,
        String departmentName,
        Double confidenceScore,
        String explanation
) {}
