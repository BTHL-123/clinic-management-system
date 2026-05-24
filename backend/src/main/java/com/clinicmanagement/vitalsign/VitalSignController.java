package com.clinicmanagement.vitalsign;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.security.CustomUserDetails;
import com.clinicmanagement.vitalsign.dto.CreateVitalSignRequest;
import com.clinicmanagement.vitalsign.dto.VitalSignResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class VitalSignController {

    private final VitalSignService vitalSignService;

    /**
     * POST /api/vital-signs
     * DOCTOR, RECEPTIONIST
     */
    @PostMapping("/vital-signs")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<VitalSignResponse>> create(
            @Valid @RequestBody CreateVitalSignRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long measuredBy = userDetails.getUser().getUserId();
        VitalSignResponse created = vitalSignService.create(request, measuredBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lưu chỉ số sinh tồn thành công", created));
    }

    /**
     * GET /api/consultations/{consultationId}/vital-signs
     * ADMIN, DOCTOR, PATIENT
     */
    @GetMapping("/consultations/{consultationId}/vital-signs")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<List<VitalSignResponse>>> getByConsultation(
            @PathVariable Long consultationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                vitalSignService.getByConsultation(consultationId)));
    }
}
