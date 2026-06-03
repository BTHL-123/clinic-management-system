package com.clinicmanagement.report.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringBatchResponse {
    private Long batchId;
    private String medicineName;
    private String batchNumber;
    private Integer currentQuantity;
    private LocalDate expiryDate;
    private Long daysUntilExpiry;
}
