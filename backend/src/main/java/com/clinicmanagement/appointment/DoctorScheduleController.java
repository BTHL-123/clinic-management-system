package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.CancelScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleResponse;
import com.clinicmanagement.appointment.dto.GenerateSlotsRequest;
import com.clinicmanagement.appointment.dto.GenerateSlotsResponse;
import com.clinicmanagement.appointment.dto.TimeSlotResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import com.clinicmanagement.appointment.dto.SlotLockResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.clinicmanagement.security.CustomUserDetails;

@RestController
@RequestMapping("/doctor-schedules")
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;
    private final SlotLockService slotLockService;

    public DoctorScheduleController(DoctorScheduleService doctorScheduleService, SlotLockService slotLockService) {
        this.doctorScheduleService = doctorScheduleService;
        this.slotLockService = slotLockService;
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> createSchedule(
            @Valid @RequestBody DoctorScheduleRequest request
    ) {
        DoctorScheduleResponse response = doctorScheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lịch làm việc thành công", response));
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> updateSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody DoctorScheduleRequest request
    ) {
        DoctorScheduleResponse response = doctorScheduleService.updateSchedule(scheduleId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch làm việc thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getSchedules(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status
    ) {
        List<DoctorScheduleResponse> response = doctorScheduleService.getSchedules(doctorId, fromDate, toDate, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> getScheduleById(@PathVariable Long scheduleId) {
        DoctorScheduleResponse response = doctorScheduleService.getScheduleById(scheduleId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getSlotsByScheduleId(
            @PathVariable Long id
    ) {
        List<TimeSlotResponse> response = doctorScheduleService.getSlotsByScheduleId(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/available-slots")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate
    ) {
        List<TimeSlotResponse> response = doctorScheduleService.getAvailableSlots(doctorId, workDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{scheduleId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> cancelScheduleByPut(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CancelScheduleRequest request
    ) {
        DoctorScheduleResponse response = doctorScheduleService.cancelSchedule(scheduleId, request.reason());
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch làm việc thành công", response));
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> cancelSchedule(
            @PathVariable Long scheduleId
    ) {
        DoctorScheduleResponse response = doctorScheduleService.cancelSchedule(scheduleId, null);
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch làm việc thành công", response));
    }

    @PostMapping("/{scheduleId}/generate-slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<GenerateSlotsResponse>> generateSlots(
            @PathVariable Long scheduleId,
            @Valid @RequestBody GenerateSlotsRequest request
    ) {
        GenerateSlotsResponse response = doctorScheduleService.generateSlots(scheduleId, request.slotDurationMinutes());
        return ResponseEntity.ok(ApiResponse.success("Tạo các slot hẹn thành công", response));
    }

    @PostMapping("/slots/{slotId}/lock")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SlotLockResponse>> lockSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SlotLockResponse response = slotLockService.lockSlot(slotId, userDetails.getUser().getUserId());
        return ResponseEntity.ok(ApiResponse.success("Giữ chỗ ca khám thành công", response));
    }

    @DeleteMapping("/slots/{slotId}/lock")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> releaseLock(
            @PathVariable Long slotId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        slotLockService.releaseLock(slotId, userDetails.getUser().getUserId());
        return ResponseEntity.ok(ApiResponse.success("Hủy giữ chỗ thành công", null));
    }
}

