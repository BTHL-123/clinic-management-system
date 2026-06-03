package com.clinicmanagement.report.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicineStockResponse {
    private BigDecimal totalStockValue;
    private Long totalBatches;
    private Long totalMedicines;
}
