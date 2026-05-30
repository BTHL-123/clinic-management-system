package com.clinicmanagement.labrequest.dto;

import com.clinicmanagement.labrequest.LabResult;

import java.time.LocalDateTime;

public record LabResultResponse(
        Long labResultId,
        String resultValue,
        String normalRange,
        String resultUnit,
        String conclusion,
        String resultFileUrl,
        LocalDateTime enteredAt
) {
    public static LabResultResponse from(LabResult r) {
        return new LabResultResponse(
                r.getLabResultId(),
                r.getResultValue(),
                r.getNormalRange(),
                r.getResultUnit(),
                r.getConclusion(),
                r.getResultFileUrl(),
                r.getEnteredAt()
        );
    }
}
