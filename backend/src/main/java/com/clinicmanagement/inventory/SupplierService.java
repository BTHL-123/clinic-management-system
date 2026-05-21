package com.clinicmanagement.inventory;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.inventory.dto.CreateSupplierRequest;
import com.clinicmanagement.inventory.dto.SupplierResponse;
import com.clinicmanagement.inventory.dto.UpdateSupplierRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> searchSuppliers(String keyword, String status, Pageable pageable) {
        Page<Supplier> page = supplierRepository.searchSuppliers(keyword, status, pageable);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long supplierId) {
        Supplier supplier = findOrThrow(supplierId);
        return mapToResponse(supplier);
    }

    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setSupplierName(request.getSupplierName());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setStatus("ACTIVE");

        Supplier saved = supplierRepository.save(supplier);
        return mapToResponse(saved);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long supplierId, UpdateSupplierRequest request) {
        Supplier supplier = findOrThrow(supplierId);

        if (request.getSupplierName() != null) supplier.setSupplierName(request.getSupplierName());
        if (request.getPhone() != null) supplier.setPhone(request.getPhone());
        if (request.getEmail() != null) supplier.setEmail(request.getEmail());
        if (request.getAddress() != null) supplier.setAddress(request.getAddress());
        if (request.getStatus() != null) supplier.setStatus(request.getStatus());

        Supplier updated = supplierRepository.save(supplier);
        return mapToResponse(updated);
    }

    private Supplier findOrThrow(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    private SupplierResponse mapToResponse(Supplier entity) {
        SupplierResponse dto = new SupplierResponse();
        dto.setSupplierId(entity.getSupplierId());
        dto.setSupplierName(entity.getSupplierName());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setAddress(entity.getAddress());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
