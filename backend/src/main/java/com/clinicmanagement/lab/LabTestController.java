package com.clinicmanagement.lab;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.lab.dto.LabTestRequest;
import com.clinicmanagement.lab.dto.LabTestResponse;
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
@RequestMapping("/lab-tests")
@RequiredArgsConstructor
public class LabTestController {

    private final LabTestService labTestService;

    /**
     * GET /api/lab-tests?status=ACTIVE&keyword=blood&page=0&size=10
     * ADMIN, DOCTOR, LAB_TECHNICIAN, RECEPTIONIST
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PageResponse<LabTestResponse>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("testName").ascending());
        return ResponseEntity.ok(ApiResponse.success(
                labTestService.getAll(status, keyword, pageable)));
    }

    /**
     * GET /api/lab-tests/{labTestId}
     * ADMIN, DOCTOR, LAB_TECHNICIAN, RECEPTIONIST
     */
    @GetMapping("/{labTestId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<LabTestResponse>> getById(@PathVariable Long labTestId) {
        return ResponseEntity.ok(ApiResponse.success(labTestService.getById(labTestId)));
    }

    /**
     * POST /api/lab-tests
     * ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> create(
            @Valid @RequestBody LabTestRequest request
    ) {
        LabTestResponse created = labTestService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo xét nghiệm thành công", created));
    }

    /**
     * PUT /api/lab-tests/{labTestId}
     * ADMIN
     */
    @PutMapping("/{labTestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> update(
            @PathVariable Long labTestId,
            @Valid @RequestBody LabTestRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật xét nghiệm thành công",
                labTestService.update(labTestId, request)));
    }

    /**
     * DELETE /api/lab-tests/{labTestId}
     * ADMIN
     */
    @DeleteMapping("/{labTestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long labTestId) {
        labTestService.delete(labTestId);
        return ResponseEntity.ok(ApiResponse.success("Xóa xét nghiệm thành công", null));
    }
}
