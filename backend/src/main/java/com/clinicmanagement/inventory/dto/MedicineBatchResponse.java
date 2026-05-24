package com.clinicmanagement.inventory.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MedicineBatchResponse {
    private Long batchId;
    private Long medicineId;
    private String medicineName;
    private Long supplierId;
    private String supplierName;
    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private BigDecimal importPrice;
    private BigDecimal sellingPrice;
    private Integer initialQuantity;
    private Integer currentQuantity;
    private String status;
    private Long importedBy;
    private LocalDateTime importedAt;
}
