package com.clinicmanagement.report;

import com.clinicmanagement.report.dto.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<RevenueReportResponse> getRevenueReport(LocalDate from, LocalDate to) {
        String sql = "SELECT DATE(paid_at) as date, SUM(final_amount) as revenue " +
                     "FROM invoices " +
                     "WHERE status = 'PAID' AND paid_at >= :from AND paid_at < :toPlusOne " +
                     "GROUP BY DATE(paid_at) " +
                     "ORDER BY date";
        
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("from", from.atStartOfDay());
        query.setParameter("toPlusOne", to.plusDays(1).atStartOfDay());

        List<Object[]> results = query.getResultList();
        List<RevenueReportResponse> response = new ArrayList<>();
        
        for (Object[] row : results) {
            java.sql.Date sqlDate = (java.sql.Date) row[0];
            BigDecimal revenue = (BigDecimal) row[1];
            response.add(new RevenueReportResponse(sqlDate.toLocalDate(), revenue));
        }
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueSummaryResponse getRevenueSummary(LocalDate from, LocalDate to) {
        String sql = "SELECT SUM(final_amount) as totalRevenue, COUNT(invoice_id) as totalInvoices " +
                     "FROM invoices " +
                     "WHERE status = 'PAID' AND paid_at >= :from AND paid_at < :toPlusOne";
        
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("from", from.atStartOfDay());
        query.setParameter("toPlusOne", to.plusDays(1).atStartOfDay());

        Object[] result = (Object[]) query.getSingleResult();
        BigDecimal totalRevenue = result[0] != null ? (BigDecimal) result[0] : BigDecimal.ZERO;
        Long totalInvoices = result[1] != null ? ((Number) result[1]).longValue() : 0L;
        
        BigDecimal averagePerInvoice = totalInvoices > 0 
                ? totalRevenue.divide(new BigDecimal(totalInvoices), 2, java.math.RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;

        return new RevenueSummaryResponse(totalRevenue, totalInvoices, averagePerInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentReportResponse> getAppointmentReport(LocalDate from, LocalDate to) {
        String sql = "SELECT status, COUNT(*) as count " +
                     "FROM appointments " +
                     "WHERE appointment_date BETWEEN :from AND :to " +
                     "GROUP BY status";
        
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("from", from);
        query.setParameter("to", to);

        List<Object[]> results = query.getResultList();
        List<AppointmentReportResponse> response = new ArrayList<>();
        
        for (Object[] row : results) {
            String status = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            response.add(new AppointmentReportResponse(status, count));
        }
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorPerformanceResponse> getDoctorPerformance(LocalDate from, LocalDate to) {
        // Native query to get doctor performance
        String sql = "SELECT d.doctor_id, u.full_name, " +
                     "COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.appointment_id END) as total_appointments, " +
                     "COALESCE(SUM(DISTINCT CASE WHEN i.status = 'PAID' THEN i.final_amount END), 0) as total_revenue, " +
                     "COALESCE(AVG(r.rating), 0) as avg_rating " +
                     "FROM doctors d " +
                     "JOIN users u ON d.user_id = u.user_id " +
                     "LEFT JOIN appointments a ON a.doctor_id = d.doctor_id AND a.appointment_date >= :fromDate AND a.appointment_date <= :toDate " +
                     "LEFT JOIN invoices i ON i.appointment_id = a.appointment_id AND i.paid_at >= :fromDateTime AND i.paid_at < :toPlusOneDateTime " +
                     "LEFT JOIN reviews r ON r.doctor_id = d.doctor_id AND r.status = 'VISIBLE' " +
                     "GROUP BY d.doctor_id, u.full_name";

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("fromDate", from);
        query.setParameter("toDate", to);
        query.setParameter("fromDateTime", from.atStartOfDay());
        query.setParameter("toPlusOneDateTime", to.plusDays(1).atStartOfDay());

        List<Object[]> results = query.getResultList();
        List<DoctorPerformanceResponse> response = new ArrayList<>();
        
        for (Object[] row : results) {
            Long doctorId = ((Number) row[0]).longValue();
            String doctorName = (String) row[1];
            Long totalAppointments = ((Number) row[2]).longValue();
            BigDecimal totalRevenue = (BigDecimal) row[3];
            Double averageRating = ((Number) row[4]).doubleValue();
            
            response.add(new DoctorPerformanceResponse(doctorId, doctorName, totalAppointments, totalRevenue, averageRating));
        }
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineStockResponse getMedicineStockSummary() {
        String sql = "SELECT SUM(current_quantity * import_price) as total_value, " +
                     "COUNT(batch_id) as total_batches, " +
                     "COUNT(DISTINCT medicine_id) as total_medicines " +
                     "FROM medicine_batches " +
                     "WHERE status != 'EXPIRED' AND current_quantity > 0";
                     
        Query query = entityManager.createNativeQuery(sql);
        Object[] result = (Object[]) query.getSingleResult();
        
        BigDecimal totalValue = result[0] != null ? (BigDecimal) result[0] : BigDecimal.ZERO;
        Long totalBatches = result[1] != null ? ((Number) result[1]).longValue() : 0L;
        Long totalMedicines = result[2] != null ? ((Number) result[2]).longValue() : 0L;
        
        return new MedicineStockResponse(totalValue, totalBatches, totalMedicines);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringBatchResponse> getExpiringBatches(int days) {
        LocalDate thresholdDate = LocalDate.now().plusDays(days);
        
        String sql = "SELECT b.batch_id, m.medicine_name, b.batch_number, b.current_quantity, b.expiry_date, " +
                     "CAST(b.expiry_date - CURRENT_DATE AS integer) as days_left " +
                     "FROM medicine_batches b " +
                     "JOIN medicines m ON b.medicine_id = m.medicine_id " +
                     "WHERE b.expiry_date <= :thresholdDate AND b.current_quantity > 0 AND b.status != 'EXPIRED' " +
                     "ORDER BY b.expiry_date ASC";
                     
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("thresholdDate", thresholdDate);
        
        List<Object[]> results = query.getResultList();
        List<ExpiringBatchResponse> response = new ArrayList<>();
        
        for (Object[] row : results) {
            Long batchId = ((Number) row[0]).longValue();
            String medicineName = (String) row[1];
            String batchNumber = (String) row[2];
            Integer currentQuantity = ((Number) row[3]).intValue();
            java.sql.Date sqlDate = (java.sql.Date) row[4];
            Long daysLeft = ((Number) row[5]).longValue();
            
            response.add(new ExpiringBatchResponse(batchId, medicineName, batchNumber, currentQuantity, sqlDate.toLocalDate(), daysLeft));
        }
        
        return response;
    }
}
