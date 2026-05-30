package com.clinicmanagement.labrequest.dto;

import com.clinicmanagement.labrequest.LabRequest;

import java.time.LocalDateTime;
import java.util.List;

public record LabRequestResponse(
        Long labRequestId,
        String requestCode,
        Long consultationId,
        Long patientId,
        Long doctorId,
        String status,
        String note,
        LocalDateTime requestedAt,
        LocalDateTime completedAt,
        List<LabRequestItemResponse> items
) {
    public static LabRequestResponse from(LabRequest r) {
        return new LabRequestResponse(
                r.getLabRequestId(),
                r.getRequestCode(),
                r.getConsultationId(),
                r.getPatientId(),
                r.getDoctorId(),
                r.getStatus(),
                r.getNote(),
                r.getRequestedAt(),
                r.getCompletedAt(),
                r.getItems().stream().map(LabRequestItemResponse::from).toList()
        );
    }
}
