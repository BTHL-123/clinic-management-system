package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.appointment.dto.SkipQueueRequest;
import com.clinicmanagement.appointment.dto.StartExaminationResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/queue-tickets")
@RequiredArgsConstructor
public class QueueTicketController {

    private final QueueTicketService queueTicketService;

    /**
     * GET /api/queue-tickets?doctorId=1&date=2026-05-28&status=WAITING
     * DOCTOR, RECEPTIONIST, ADMIN
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<List<QueueTicketResponse>>> getQueue(
            @RequestParam Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status
    ) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(
                queueTicketService.getQueue(doctorId, queryDate, status)));
    }

    /**
     * GET /api/queue-tickets/{queueTicketId}
     */
    @GetMapping("/{queueTicketId}")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMIN','PATIENT')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> getById(@PathVariable Long queueTicketId) {
        return ResponseEntity.ok(ApiResponse.success(queueTicketService.getById(queueTicketId)));
    }

    /**
     * PUT /api/queue-tickets/{queueTicketId}/call
     * Gọi bệnh nhân vào phòng khám
     */
    @PutMapping("/{queueTicketId}/call")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> call(@PathVariable Long queueTicketId) {
        return ResponseEntity.ok(ApiResponse.success("Đã gọi bệnh nhân",
                queueTicketService.call(queueTicketId)));
    }

    /**
     * PUT /api/queue-tickets/{queueTicketId}/start-examination
     * Bác sĩ bắt đầu phiên khám — tạo ConsultationSession và chuyển trạng thái
     */
    @PutMapping("/{queueTicketId}/start-examination")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<StartExaminationResponse>> startExamination(
            @PathVariable Long queueTicketId) {
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu khám thành công",
                queueTicketService.startExamination(queueTicketId)));
    }

    /**
     * PUT /api/queue-tickets/{queueTicketId}/done
     */
    @PutMapping("/{queueTicketId}/done")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> markDone(@PathVariable Long queueTicketId) {
        return ResponseEntity.ok(ApiResponse.success("Hoàn thành khám",
                queueTicketService.markDone(queueTicketId)));
    }

    /**
     * PUT /api/queue-tickets/{queueTicketId}/skip
     */
    @PutMapping("/{queueTicketId}/skip")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> skip(
            @PathVariable Long queueTicketId,
            @RequestBody(required = false) SkipQueueRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ qua",
                queueTicketService.skip(queueTicketId, request)));
    }
}
