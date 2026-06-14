package com.clinicmanagement.aichat.dto;

import java.util.List;

public record AiSpecialtySuggestionResponse(
        Long suggestionId,
        Long departmentId,
        String departmentName,
        Double confidenceScore,
        String explanation,
        String message,
        List<Recommendation> recommendations
) {
    public record Recommendation(
            String departmentName,
            Double confidenceScore,
            String explanation
    ) {}
}
