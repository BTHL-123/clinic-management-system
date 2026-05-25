package com.clinicmanagement.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockTransactionResponse {
    private Long stockTransactionId;
    private Long medicineId;
    private String medicineName;
    private Long batchId;
    private String batchNumber;
    private String transactionType;
    private Integer quantity;
    private String referenceType;
    private Long referenceId;
    private String note;
    private Long createdBy;
    private LocalDateTime createdAt;
}
