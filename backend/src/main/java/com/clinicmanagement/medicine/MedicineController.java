package com.clinicmanagement.medicine;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicine.dto.MedicineRequest;
import com.clinicmanagement.medicine.dto.MedicineResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    /**
     * GET /api/medicines?keyword=para&status=ACTIVE&page=0&size=10
     * ADMIN, DOCTOR, PHARMACIST
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST')")
    public ResponseEntity<ApiResponse<PageResponse<MedicineResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("medicineName").ascending());
        return ResponseEntity.ok(ApiResponse.success(
                medicineService.getAll(status, keyword, pageable)));
    }

    /**
     * GET /api/medicines/{medicineId}
     * ADMIN, DOCTOR, PHARMACIST
     */
    @GetMapping("/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineResponse>> getById(@PathVariable Long medicineId) {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getById(medicineId)));
    }

    /**
     * POST /api/medicines
     * ADMIN, PHARMACIST
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineResponse>> create(
            @Valid @RequestBody MedicineRequest request
    ) {
        MedicineResponse created = medicineService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thuốc thành công", created));
    }

    /**
     * PUT /api/medicines/{medicineId}
     * ADMIN, PHARMACIST
     */
    @PutMapping("/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineResponse>> update(
            @PathVariable Long medicineId,
            @Valid @RequestBody MedicineRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thuốc thành công",
                medicineService.update(medicineId, request)));
    }

    /**
     * DELETE /api/medicines/{medicineId}
     * ADMIN, PHARMACIST
     */
    @DeleteMapping("/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long medicineId) {
        medicineService.delete(medicineId);
        return ResponseEntity.ok(ApiResponse.success("Xóa thuốc thành công", null));
    }
}
