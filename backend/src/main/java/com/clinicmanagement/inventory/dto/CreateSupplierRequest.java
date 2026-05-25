package com.clinicmanagement.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSupplierRequest {
    @NotBlank(message = "Supplier name is required")
    private String supplierName;

    private String phone;
    private String email;
    private String address;
}
