package com.clinicmanagement.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SupplierResponse {
    private Long supplierId;
    private String supplierName;
    private String phone;
    private String email;
    private String address;
    private String status;
    private LocalDateTime createdAt;
}
