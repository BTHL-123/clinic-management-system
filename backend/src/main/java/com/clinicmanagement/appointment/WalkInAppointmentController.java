package com.clinicmanagement.appointment;
 
import com.clinicmanagement.appointment.dto.AppointmentResponse;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class WalkInAppointmentController {

    private final WalkInAppointmentService walkInAppointmentService;
    private final AppointmentService appointmentService;

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

    /**
     * GET /api/receptionist/appointments
     * Search and filter appointments for receptionist dashboard.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<com.clinicmanagement.common.dto.PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction
    ) {
        Sort sort = Sort.by(
                direction.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);
        com.clinicmanagement.common.dto.PageResponse<AppointmentResponse> response = 
                appointmentService.searchAppointmentsForReceptionist(keyword, date, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/receptionist/appointments/{appointmentId}/check-in
     * Check-in an appointment for receptionist dashboard.
     */
    @PutMapping("/{appointmentId}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> checkInAppointment(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long receptionistId = userDetails.getUser().getUserId();
        AppointmentResponse response = appointmentService.checkInAppointment(appointmentId, receptionistId);
        return ResponseEntity.ok(ApiResponse.success("Check-in bệnh nhân thành công", response));
    }
}
