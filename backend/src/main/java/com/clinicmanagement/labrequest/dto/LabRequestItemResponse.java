package com.clinicmanagement.labrequest.dto;

import com.clinicmanagement.labrequest.LabRequestItem;

public record LabRequestItemResponse(
        Long labRequestItemId,
        Long labTestId,
        String testName,
        String testCode,
        String status,
        String note,
        LabResultResponse labResult
) {
    public static LabRequestItemResponse from(LabRequestItem item) {
        return new LabRequestItemResponse(
                item.getLabRequestItemId(),
                item.getLabTest().getLabTestId(),
                item.getLabTest().getTestName(),
                item.getLabTest().getTestCode(),
                item.getStatus(),
                item.getNote(),
                item.getLabResult() != null ? LabResultResponse.from(item.getLabResult()) : null
        );
    }
}
