package com.clinicmanagement.report;

import com.clinicmanagement.report.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<RevenueReportResponse> getRevenueReport(LocalDate from, LocalDate to);
    RevenueSummaryResponse getRevenueSummary(LocalDate from, LocalDate to);
    List<AppointmentReportResponse> getAppointmentReport(LocalDate from, LocalDate to);
    List<DoctorPerformanceResponse> getDoctorPerformance(LocalDate from, LocalDate to);
    MedicineStockResponse getMedicineStockSummary();
    List<ExpiringBatchResponse> getExpiringBatches(int days);
}
