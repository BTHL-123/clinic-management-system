package com.clinicmanagement.doctorleave;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestCreateRequest;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctor/leave-requests")
@RequiredArgsConstructor
public class DoctorLeaveRequestController {

    private final DoctorLeaveRequestService leaveRequestService;

    /**
     * POST /api/doctor/leave-requests
     * Doctor creates a leave or schedule-change request.
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorLeaveRequestResponse>> create(
            @Valid @RequestBody DoctorLeaveRequestCreateRequest request,
            @AuthenticationPrincipal com.clinicmanagement.security.CustomUserDetails userDetails
    ) {
        DoctorLeaveRequestResponse response = leaveRequestService.createLeaveRequest(
                request, userDetails.getUsername()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu nghỉ thành công", response));
    }

    /**
     * GET /api/doctor/leave-requests/my
     * Doctor views their own requests.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorLeaveRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal com.clinicmanagement.security.CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.getMyLeaveRequests(userDetails.getUsername())
        ));
    }

    /**
     * DELETE /api/doctor/leave-requests/{id}
     * Doctor cancels a PENDING request. Only owner can cancel.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal com.clinicmanagement.security.CustomUserDetails userDetails
    ) {
        leaveRequestService.cancelLeaveRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Hủy yêu cầu thành công", null));
    }
}
