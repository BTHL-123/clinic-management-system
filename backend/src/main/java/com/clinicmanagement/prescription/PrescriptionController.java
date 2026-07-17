package com.clinicmanagement.prescription;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.prescription.dto.CreatePrescriptionRequest;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
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
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final DrugInteractionService drugInteractionService;

    /**
     * GET /api/prescriptions?status=CREATED&page=0&size=10
     * PHARMACIST, ADMIN — danh sách đơn thuốc để cấp phát
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<PageResponse<PrescriptionResponse>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getAll(status, pageable)));
    }

    /**
     * POST /api/prescriptions
     * DOCTOR
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> create(
            @Valid @RequestBody CreatePrescriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn thuốc thành công",
                        prescriptionService.create(request)));
    }

    /**
     * GET /api/prescriptions/{prescriptionId}
     */
    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','RECEPTIONIST','PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getById(
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success(
                prescriptionService.getById(prescriptionId)));
    }

    /**
     * GET /api/prescriptions/by-consultation/{consultationId}
     */
    @GetMapping("/by-consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','RECEPTIONIST','PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getByConsultationId(
            @PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success(
                prescriptionService.getByConsultationId(consultationId)));
    }

    /**
     * POST /api/prescriptions/{prescriptionId}/check-interactions
     * DOCTOR
     */
    @PostMapping("/{prescriptionId}/check-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DrugInteractionResponse>> checkInteractions(
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra tương tác thuốc hoàn tất",
                drugInteractionService.checkInteraction(prescriptionId)));
    }

    /**
     * POST /api/prescriptions/check-interactions-draft
     * DOCTOR
     */
    @PostMapping("/check-interactions-draft")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DrugInteractionResponse>> checkInteractionsDraft(
            @RequestBody List<Long> medicineIds) {
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra tương tác nháp hoàn tất",
                drugInteractionService.checkInteractionDraft(medicineIds)));
    }

    /**
     * POST /api/prescriptions/{prescriptionId}/dispense
     * PHARMACIST — cấp phát thuốc và xuất kho
     */
    @PostMapping("/{prescriptionId}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> dispense(
            @PathVariable Long prescriptionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Cấp phát thuốc thành công",
                prescriptionService.dispense(prescriptionId, userDetails.getUser())));
    }
}
