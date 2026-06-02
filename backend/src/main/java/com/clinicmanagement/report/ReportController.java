package com.clinicmanagement.report;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.report.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<RevenueReportResponse>>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getRevenueReport(from, to)));
    }

    @GetMapping("/revenue/summary")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getRevenueSummary(from, to)));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<AppointmentReportResponse>>> getAppointmentReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getAppointmentReport(from, to)));
    }

    @GetMapping("/doctor-performance")
    public ResponseEntity<ApiResponse<List<DoctorPerformanceResponse>>> getDoctorPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDoctorPerformance(from, to)));
    }

    @GetMapping("/medicine-stock")
    public ResponseEntity<ApiResponse<MedicineStockResponse>> getMedicineStockSummary() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getMedicineStockSummary()));
    }

    @GetMapping("/medicine-expiring")
    public ResponseEntity<ApiResponse<List<ExpiringBatchResponse>>> getExpiringBatches(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getExpiringBatches(days)));
    }
}
