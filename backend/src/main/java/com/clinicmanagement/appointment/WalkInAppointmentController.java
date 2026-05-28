package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.WalkInAppointmentRequest;
import com.clinicmanagement.appointment.dto.WalkInAppointmentResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class WalkInAppointmentController {

    private final WalkInAppointmentService walkInAppointmentService;

    /**
     * POST /api/receptionist/appointments/walk-in
     * <p>
     * Creates a walk-in appointment for a patient who arrives at the clinic
     * without a prior online booking.
     * <p>
     * Accessible only by users with ADMIN or RECEPTIONIST role.
     */
    @PostMapping("/walk-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<WalkInAppointmentResponse>> createWalkInAppointment(
            @Valid @RequestBody WalkInAppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long createdByUserId = userDetails.getUser().getUserId();
        WalkInAppointmentResponse response = walkInAppointmentService.createWalkIn(request, createdByUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lịch khám trực tiếp thành công", response));
    }
}
