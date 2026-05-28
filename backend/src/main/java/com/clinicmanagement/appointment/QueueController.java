package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/receptionist/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<QueueTicketResponse>>> getQueue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status
    ) {
        List<QueueTicketResponse> response = queueService.getQueue(date, doctorId, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{queueTicketId}/call")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> callPatient(@PathVariable Long queueTicketId) {
        QueueTicketResponse response = queueService.callPatient(queueTicketId);
        return ResponseEntity.ok(ApiResponse.success("Gọi khám bệnh nhân thành công", response));
    }

    @PutMapping("/{queueTicketId}/skip")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> skipPatient(@PathVariable Long queueTicketId) {
        QueueTicketResponse response = queueService.skipPatient(queueTicketId);
        return ResponseEntity.ok(ApiResponse.success("Bỏ qua bệnh nhân thành công", response));
    }

    @PutMapping("/{queueTicketId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueTicketResponse>> completePatient(@PathVariable Long queueTicketId) {
        QueueTicketResponse response = queueService.completePatient(queueTicketId);
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất ca khám thành công", response));
    }
}
