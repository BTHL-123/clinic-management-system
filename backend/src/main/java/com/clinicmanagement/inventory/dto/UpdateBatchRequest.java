package com.clinicmanagement.inventory.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateBatchRequest {
    private LocalDate expiryDate;
    private BigDecimal importPrice;
    private BigDecimal sellingPrice;
    private String status;
}
