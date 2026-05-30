package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.BookAppointmentRequest;
import com.clinicmanagement.appointment.dto.CancelAppointmentRequest;
import com.clinicmanagement.appointment.dto.RescheduleAppointmentRequest;
import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
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
        PageResponse<AppointmentResponse> response = appointmentService.getAppointments(
                patientId, doctorId, date, status, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isPatientOrDoctor = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT") || a.getAuthority().equals("ROLE_DOCTOR"));
        AppointmentResponse response = appointmentService.getAppointmentById(
                id,
                userDetails.getUser().getUserId(),
                isPatientOrDoctor
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getMyAppointments(
            @RequestParam(defaultValue = "true") boolean upcoming,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Sort sort = Sort.by(
                direction.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<AppointmentResponse> response = appointmentService.getMyAppointments(
                userDetails.getUser().getUserId(), upcoming, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/doctor/today")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<java.util.List<AppointmentResponse>>> getDoctorTodayAppointments(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        java.util.List<AppointmentResponse> response = appointmentService.getDoctorTodayAppointments(
                userDetails.getUser().getUserId()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody BookAppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AppointmentResponse response = appointmentService.bookAppointment(request, userDetails.getUser().getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đặt lịch khám thành công", response));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CancelAppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isReceptionist = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECEPTIONIST") || a.getAuthority().equals("ROLE_ADMIN"));
        
        AppointmentResponse response = appointmentService.cancelAppointment(
                id,
                request.cancellationReason(),
                userDetails.getUser().getUserId(),
                isReceptionist
        );
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch khám thành công", response));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isPrivileged = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECEPTIONIST") || a.getAuthority().equals("ROLE_ADMIN"));

        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request, userDetails.getUser().getUserId(), isPrivileged);
        return ResponseEntity.ok(ApiResponse.success("Dời lịch khám thành công", response));
    }
}
