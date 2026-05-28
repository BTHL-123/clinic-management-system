package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lab-requests")
@RequiredArgsConstructor
public class LabRequestController {

    private final LabRequestService labRequestService;

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
}
