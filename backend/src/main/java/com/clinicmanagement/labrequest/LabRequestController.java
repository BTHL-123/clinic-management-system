package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
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

import java.util.List;

@RestController
@RequestMapping("/lab-requests")
@RequiredArgsConstructor
public class LabRequestController {

    private final LabRequestService labRequestService;
    private final PatientRepository patientRepository;

    /**
     * GET /api/lab-requests?status=REQUESTED&page=0&size=10
     * LAB_TECHNICIAN, ADMIN, DOCTOR
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<PageResponse<LabRequestResponse>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(labRequestService.getAll(status, pageable)));
    }

    /**
     * POST /api/lab-requests
     * DOCTOR
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<LabRequestResponse>> create(
            @Valid @RequestBody CreateLabRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu xét nghiệm thành công",
                        labRequestService.create(request)));
    }

    /**
     * GET /api/lab-requests/{labRequestId}
     */
    @GetMapping("/{labRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<LabRequestResponse>> getById(@PathVariable Long labRequestId) {
        return ResponseEntity.ok(ApiResponse.success(labRequestService.getById(labRequestId)));
    }

    /**
     * GET /api/lab-requests/by-consultation/{consultationId}
     */
    @GetMapping("/by-consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<LabRequestResponse>>> getByConsultationId(
            @PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success(
                labRequestService.getByConsultationId(consultationId)));
    }

    /**
     * PUT /api/lab-requests/{labRequestId}/accept
     * LAB_TECHNICIAN — tiếp nhận phiếu, chuyển REQUESTED → IN_PROGRESS
     */
    @PutMapping("/{labRequestId}/accept")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMIN')")
    public ResponseEntity<ApiResponse<LabRequestResponse>> accept(
            @PathVariable Long labRequestId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(ApiResponse.success("Tiếp nhận phiếu xét nghiệm thành công",
                labRequestService.accept(labRequestId, userId)));
    }

    /**
     * GET /api/lab-requests/my?page=0&size=10
     * PATIENT — xem tất cả phiếu xét nghiệm của mình (Task 80)
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PageResponse<LabRequestResponse>>> getMyLabRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getUserId();
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new com.clinicmanagement.common.exception.ResourceNotFoundException(
                        "Không tìm thấy hồ sơ bệnh nhân."));
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                labRequestService.getByPatientId(patient.getPatientId(), pageable)));
    }
}
