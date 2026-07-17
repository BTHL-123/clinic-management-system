package com.clinicmanagement.doctorleave;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestResponse;
import com.clinicmanagement.doctorleave.dto.ReviewDoctorLeaveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/doctor-leave-requests")
@RequiredArgsConstructor
public class AdminDoctorLeaveRequestController {

    private final DoctorLeaveRequestService leaveRequestService;

    /**
     * GET /api/admin/doctor-leave-requests?status=PENDING|APPROVED|REJECTED
     * Returns all requests, optionally filtered by status.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String status
    ) {
        List<DoctorLeaveRequestResponse> result;
        if (status != null && !status.isBlank()) {
            DoctorLeaveRequest.LeaveStatus leaveStatus;
            try {
                leaveStatus = DoctorLeaveRequest.LeaveStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Trạng thái không hợp lệ: " + status));
            }
            result = leaveRequestService.getLeaveRequestsByStatus(leaveStatus);
        } else {
            result = leaveRequestService.getAllLeaveRequests();
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * PUT /api/admin/doctor-leave-requests/{id}/approve
     * Approves a PENDING leave request.
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorLeaveRequestResponse>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal com.clinicmanagement.security.CustomUserDetails userDetails
    ) {
        DoctorLeaveRequestResponse response = leaveRequestService.approveLeaveRequest(
                id, userDetails.getUsername()
        );
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu đã được phê duyệt", response));
    }

    /**
     * PUT /api/admin/doctor-leave-requests/{id}/reject
     * Rejects a PENDING leave request. adminComment is required.
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorLeaveRequestResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewDoctorLeaveRequest request,
            @AuthenticationPrincipal com.clinicmanagement.security.CustomUserDetails userDetails
    ) {
        DoctorLeaveRequestResponse response = leaveRequestService.rejectLeaveRequest(
                id, request, userDetails.getUsername()
        );
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu đã bị từ chối", response));
    }
}
