package com.clinicmanagement.appointment.dto;

public record StartExaminationResponse(
        Long queueTicketId,
        String status,
        Long consultationId
) {}
