package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.labrequest.dto.CreateLabResultRequest;
import com.clinicmanagement.labrequest.dto.LabResultResponse;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lab-results")
@RequiredArgsConstructor
public class LabResultController {

    private final LabResultService labResultService;

    /**
     * POST /api/lab-results
     * LAB_TECHNICIAN — nhập kết quả xét nghiệm cho từng mục
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMIN')")
    public ResponseEntity<ApiResponse<LabResultResponse>> create(
            @Valid @RequestBody CreateLabResultRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhập kết quả xét nghiệm thành công",
                        labResultService.create(request, userId)));
    }

    /**
     * GET /api/lab-results/by-item/{labRequestItemId}
     */
    @GetMapping("/by-item/{labRequestItemId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<LabResultResponse>> getByItemId(
            @PathVariable Long labRequestItemId) {
        return ResponseEntity.ok(ApiResponse.success(
                labResultService.getByItemId(labRequestItemId)));
    }
}
