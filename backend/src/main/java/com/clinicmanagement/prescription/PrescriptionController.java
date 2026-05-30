package com.clinicmanagement.prescription;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * GET /api/prescriptions/{prescriptionId}
     */
    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getById(@PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getById(prescriptionId)));
    }

    /**
     * GET /api/prescriptions/by-consultation/{consultationId}
     */
    @GetMapping("/by-consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getByConsultationId(
            @PathVariable Long consultationId) {
        return ResponseEntity.ok(ApiResponse.success(
                prescriptionService.getByConsultationId(consultationId)));
    }
}
