package com.clinicmanagement.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MedicineStockAlertResponse {
    private Long alertId;
    private Long medicineId;
    private String medicineName;
    private Long batchId;
    private String batchNumber;
    private String alertType;
    private String message;
    private Boolean isResolved;
    private Long resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
