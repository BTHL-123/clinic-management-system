package com.clinicmanagement.consultation;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.consultation.dto.ChangeConsultationStatusRequest;
import com.clinicmanagement.consultation.dto.ConsultationResponse;
import com.clinicmanagement.consultation.dto.CreateConsultationRequest;
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
@RequestMapping("/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    /**
     * GET /api/consultations?patientId=&doctorId=&status=&page=0&size=10
     * ADMIN, DOCTOR, RECEPTIONIST
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PageResponse<ConsultationResponse>>> getAll(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                consultationService.getAll(patientId, doctorId, status, pageable)));
    }

    /**
     * GET /api/consultations/{consultationId}
     * ADMIN, DOCTOR, PATIENT (owner check handled at service layer when integrated)
     */
    @GetMapping("/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getById(@PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getById(consultationId)));
    }

    /**
     * POST /api/consultations
     * DOCTOR
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> create(
            @Valid @RequestBody CreateConsultationRequest request
    ) {
        ConsultationResponse created = consultationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiên khám thành công", created));
    }

    /**
     * PUT /api/consultations/{consultationId}/start
     * DOCTOR
     */
    @PutMapping("/{consultationId}/start")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> start(@PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu phiên khám thành công",
                consultationService.start(consultationId)));
    }

    /**
     * PUT /api/consultations/{consultationId}/complete
     * DOCTOR
     */
    @PutMapping("/{consultationId}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> complete(@PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success("Hoàn thành phiên khám thành công",
                consultationService.complete(consultationId)));
    }

    /**
     * PUT /api/consultations/{consultationId}/status
     * DOCTOR
     */
    @PutMapping("/{consultationId}/status")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> changeStatus(
            @PathVariable Long consultationId,
            @Valid @RequestBody ChangeConsultationStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công",
                consultationService.changeStatus(consultationId, request)));
    }
}
