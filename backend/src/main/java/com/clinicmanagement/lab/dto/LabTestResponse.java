package com.clinicmanagement.lab.dto;

import com.clinicmanagement.lab.LabTest;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LabTestResponse(
        Long labTestId,
        String testCode,
        String testName,
        String description,
        BigDecimal price,
        String status,
        LocalDateTime createdAt
) {
    public static LabTestResponse from(LabTest t) {
        return new LabTestResponse(
                t.getLabTestId(),
                t.getTestCode(),
                t.getTestName(),
                t.getDescription(),
                t.getPrice(),
                t.getStatus(),
                t.getCreatedAt()
        );
    }
}
