package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.PatientQueueStatusResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientQueueController {

    private final QueueService queueService;

    /**
     * GET /api/patient/queue-status
     * Returns the current queue status for the logged-in patient.
     * Only accessible by PATIENT role.
     */
    @GetMapping("/queue-status")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientQueueStatusResponse>> getMyQueueStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getUserId();
        PatientQueueStatusResponse response = queueService.getPatientQueueStatus(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
