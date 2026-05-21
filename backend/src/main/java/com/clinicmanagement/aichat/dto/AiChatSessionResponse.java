package com.clinicmanagement.aichat.dto;

import com.clinicmanagement.aichat.AiChatSession;

public record AiChatSessionResponse(
        Long aiChatSessionId,
        String sessionType,
        Long patientId
) {
    public static AiChatSessionResponse from(AiChatSession session) {
        return new AiChatSessionResponse(
                session.getAiChatSessionId(),
                session.getSessionType(),
                session.getPatient() != null ? session.getPatient().getPatientId() : null
        );
    }
}
