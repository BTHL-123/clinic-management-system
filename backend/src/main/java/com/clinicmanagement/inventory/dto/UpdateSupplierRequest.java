package com.clinicmanagement.inventory.dto;

import lombok.Data;

@Data
public class UpdateSupplierRequest {
    private String supplierName;
    private String phone;
    private String email;
    private String address;
    private String status;
}
