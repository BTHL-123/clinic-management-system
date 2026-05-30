package com.clinicmanagement.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExportTransactionRequest {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    private Long batchId;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    private String note;
}
