package com.clinicmanagement.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ImportBatchRequest {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    private Long supplierId;

    @NotNull(message = "Batch number is required")
    private String batchNumber;

    private LocalDate manufactureDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    @NotNull(message = "Import price is required")
    private BigDecimal importPrice;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    @NotNull(message = "Quantity is required")
    private Integer quantity;
}
