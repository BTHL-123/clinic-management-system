package com.clinicmanagement.inventory;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.inventory.dto.*;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PageResponse<MedicineBatchResponse>>> getBatches(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expiryDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getBatches(medicineId, status, pageable)));
    }

    @PostMapping("/batches/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineBatchResponse>> importBatch(
            @Valid @RequestBody ImportBatchRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        MedicineBatchResponse response = inventoryService.importBatch(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Nhập kho thành công", response));
    }

    @PutMapping("/batches/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineBatchResponse>> updateBatch(
            @PathVariable Long id,
            @RequestBody UpdateBatchRequest request
    ) {
        MedicineBatchResponse response = inventoryService.updateBatch(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lô thuốc thành công", response));
    }

    @DeleteMapping("/batches/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        inventoryService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy lô thuốc thành công", null));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PageResponse<StockTransactionResponse>>> getTransactions(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getTransactions(medicineId, transactionType, pageable)));
    }

    @PostMapping("/transactions/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<StockTransactionResponse>> exportStock(
            @Valid @RequestBody ExportTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        StockTransactionResponse response = inventoryService.exportStock(request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Xuất kho thành công", response));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PageResponse<MedicineStockAlertResponse>>> getActiveAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        // Generate alerts on-demand to ensure they are up-to-date
        // This allows users to see current alerts without waiting for the midnight CronJob
        inventoryService.generateAlertsOnDemand();
        
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getActiveAlerts(pageable)));
    }

    @PutMapping("/alerts/{alertId}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Void>> resolveAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        inventoryService.resolveAlert(alertId, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu xử lý cảnh báo thành công", null));
    }
}
