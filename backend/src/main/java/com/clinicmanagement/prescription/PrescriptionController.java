package com.clinicmanagement.prescription;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.prescription.dto.CreatePrescriptionRequest;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final DrugInteractionService drugInteractionService;

    /**
     * POST /api/prescriptions
     * DOCTOR - Task 47: Create prescription
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> create(
            @Valid @RequestBody CreatePrescriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao don thuoc thanh cong",
                        prescriptionService.create(request)));
    }

    /**
     * GET /api/prescriptions/{prescriptionId}
     */
    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getById(
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success(
                prescriptionService.getById(prescriptionId)));
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

    /**
     * POST /api/prescriptions/{prescriptionId}/check-interactions
     * DOCTOR - Task 48: Check drug interaction
     */
    @PostMapping("/{prescriptionId}/check-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DrugInteractionResponse>> checkInteractions(
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success("Kiem tra tuong tac thuoc hoan tat",
                drugInteractionService.checkInteraction(prescriptionId)));
    }
}
