package com.clinicmanagement.inventory;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.inventory.dto.CreateSupplierRequest;
import com.clinicmanagement.inventory.dto.SupplierResponse;
import com.clinicmanagement.inventory.dto.UpdateSupplierRequest;
import org.springframework.data.domain.Pageable;

public interface SupplierService {

    PageResponse<SupplierResponse> searchSuppliers(String keyword, String status, Pageable pageable);

    SupplierResponse getSupplierById(Long supplierId);

    SupplierResponse createSupplier(CreateSupplierRequest request);

    SupplierResponse updateSupplier(Long supplierId, UpdateSupplierRequest request);
}
