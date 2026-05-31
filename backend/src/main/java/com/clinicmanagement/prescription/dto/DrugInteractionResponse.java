package com.clinicmanagement.prescription.dto;

import java.util.List;

public record DrugInteractionResponse(
        Long prescriptionId,
        String warningLevel,
        String warningMessage,
        List<InteractionDetail> interactions,
        boolean checked
) {
    public record InteractionDetail(
            String drug1,
            String drug2,
            String severity,
            String description
    ) {}
}
