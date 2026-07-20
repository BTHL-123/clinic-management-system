package com.clinicmanagement.report;

import com.clinicmanagement.report.dto.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<RevenueReportResponse> getRevenueReport(LocalDate from, LocalDate to) {
        String sql = "SELECT CAST(paid_at AS DATE) as date, SUM(final_amount) as revenue " +
                     "FROM invoices " +
                     "WHERE status = 'PAID' AND paid_at >= :from AND paid_at < :toPlusOne " +
                     "GROUP BY CAST(paid_at AS DATE) " +
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
    public RevenueDashboardResponse getRevenueDashboard(LocalDate from, LocalDate to) {
        validateRevenueRange(from, to);

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();
        long periodDays = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate previousTo = from.minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(periodDays - 1);

        Object[] paymentSummary = getPaymentSummary(fromDateTime, toDateTime);
        BigDecimal grossRevenue = decimalValue(paymentSummary[0]);
        long successfulPayments = longValue(paymentSummary[1]);
        long paidInvoices = longValue(paymentSummary[2]);
        BigDecimal refundedAmount = getCompletedRefundAmount(fromDateTime, toDateTime);
        BigDecimal netRevenue = grossRevenue.subtract(refundedAmount);

        Object[] previousPaymentSummary = getPaymentSummary(
                previousFrom.atStartOfDay(), previousTo.plusDays(1).atStartOfDay());
        BigDecimal previousGrossRevenue = decimalValue(previousPaymentSummary[0]);
        BigDecimal previousRefundedAmount = getCompletedRefundAmount(
                previousFrom.atStartOfDay(), previousTo.plusDays(1).atStartOfDay());
        BigDecimal previousNetRevenue = previousGrossRevenue.subtract(previousRefundedAmount);
        BigDecimal growthRate = previousNetRevenue.compareTo(BigDecimal.ZERO) == 0
                ? null
                : netRevenue.subtract(previousNetRevenue)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(previousNetRevenue.abs(), 2, RoundingMode.HALF_UP);

        BigDecimal averagePayment = successfulPayments == 0
                ? BigDecimal.ZERO
                : grossRevenue.divide(BigDecimal.valueOf(successfulPayments), 2, RoundingMode.HALF_UP);

        Object[] outstandingSummary = getOutstandingSummary(fromDateTime, toDateTime);
        Object[] pendingRefundSummary = getPendingRefundSummary(fromDateTime, toDateTime);

        return new RevenueDashboardResponse(
                from,
                to,
                grossRevenue,
                refundedAmount,
                netRevenue,
                previousNetRevenue,
                growthRate,
                successfulPayments,
                paidInvoices,
                averagePayment,
                decimalValue(outstandingSummary[0]),
                longValue(outstandingSummary[1]),
                decimalValue(pendingRefundSummary[0]),
                longValue(pendingRefundSummary[1]),
                getRevenueTrend(from, to),
                getRevenueBreakdown("payment_method", fromDateTime, toDateTime),
                getRevenueBreakdown("payment_type", fromDateTime, toDateTime),
                getInvoiceStatusBreakdown(fromDateTime, toDateTime),
                getRecentPayments(fromDateTime, toDateTime)
        );
    }

    private void validateRevenueRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian báo cáo không hợp lệ");
        }
        if (ChronoUnit.DAYS.between(from, to) > 731) {
            throw new IllegalArgumentException("Khoảng thời gian báo cáo không được vượt quá 2 năm");
        }
    }

    private Object[] getPaymentSummary(LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(amount), 0), COUNT(*), COUNT(DISTINCT invoice_id) " +
                "FROM payments " +
                "WHERE status IN ('PAID', 'REFUNDED') AND paid_at >= :from AND paid_at < :to");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);
        return (Object[]) query.getSingleResult();
    }

    private BigDecimal getCompletedRefundAmount(LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(refund_amount), 0) FROM refunds " +
                "WHERE status = 'COMPLETED' AND completed_at >= :from AND completed_at < :to");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);
        return decimalValue(query.getSingleResult());
    }

    private Object[] getOutstandingSummary(LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(final_amount), 0), COUNT(*) FROM invoices " +
                "WHERE status IN ('UNPAID', 'PARTIALLY_PAID') " +
                "AND created_at >= :from AND created_at < :to");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);
        return (Object[]) query.getSingleResult();
    }

    private Object[] getPendingRefundSummary(LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(refund_amount), 0), COUNT(*) FROM refunds " +
                "WHERE status IN ('PENDING', 'APPROVED') " +
                "AND requested_at >= :from AND requested_at < :to");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);
        return (Object[]) query.getSingleResult();
    }

    private List<RevenueDashboardResponse.RevenueTrendPoint> getRevenueTrend(LocalDate from, LocalDate to) {
        Map<LocalDate, RevenueTrendAccumulator> points = new LinkedHashMap<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            points.put(date, new RevenueTrendAccumulator());
        }

        Query paymentsQuery = entityManager.createNativeQuery(
                "SELECT CAST(paid_at AS DATE), COALESCE(SUM(amount), 0), COUNT(*) FROM payments " +
                "WHERE status IN ('PAID', 'REFUNDED') AND paid_at >= :from AND paid_at < :to " +
                "GROUP BY CAST(paid_at AS DATE) ORDER BY CAST(paid_at AS DATE)");
        paymentsQuery.setParameter("from", from.atStartOfDay());
        paymentsQuery.setParameter("to", to.plusDays(1).atStartOfDay());
        for (Object[] row : (List<Object[]>) paymentsQuery.getResultList()) {
            RevenueTrendAccumulator point = points.get(dateValue(row[0]));
            if (point != null) {
                point.grossRevenue = decimalValue(row[1]);
                point.transactionCount = longValue(row[2]);
            }
        }

        Query refundsQuery = entityManager.createNativeQuery(
                "SELECT CAST(completed_at AS DATE), COALESCE(SUM(refund_amount), 0) FROM refunds " +
                "WHERE status = 'COMPLETED' AND completed_at >= :from AND completed_at < :to " +
                "GROUP BY CAST(completed_at AS DATE) ORDER BY CAST(completed_at AS DATE)");
        refundsQuery.setParameter("from", from.atStartOfDay());
        refundsQuery.setParameter("to", to.plusDays(1).atStartOfDay());
        for (Object[] row : (List<Object[]>) refundsQuery.getResultList()) {
            RevenueTrendAccumulator point = points.get(dateValue(row[0]));
            if (point != null) {
                point.refundedAmount = decimalValue(row[1]);
            }
        }

        return points.entrySet().stream()
                .map(entry -> new RevenueDashboardResponse.RevenueTrendPoint(
                        entry.getKey(),
                        entry.getValue().grossRevenue,
                        entry.getValue().refundedAmount,
                        entry.getValue().grossRevenue.subtract(entry.getValue().refundedAmount),
                        entry.getValue().transactionCount))
                .toList();
    }

    private List<RevenueDashboardResponse.RevenueBreakdownItem> getRevenueBreakdown(
            String column, LocalDateTime from, LocalDateTime toExclusive) {
        if (!"payment_method".equals(column) && !"payment_type".equals(column)) {
            throw new IllegalArgumentException("Loại phân tích doanh thu không hợp lệ");
        }
        Query query = entityManager.createNativeQuery(
                "SELECT " + column + ", COALESCE(SUM(amount), 0), COUNT(*) FROM payments " +
                "WHERE status IN ('PAID', 'REFUNDED') AND paid_at >= :from AND paid_at < :to " +
                "GROUP BY " + column + " ORDER BY SUM(amount) DESC");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);

        List<RevenueDashboardResponse.RevenueBreakdownItem> items = new ArrayList<>();
        for (Object[] row : (List<Object[]>) query.getResultList()) {
            items.add(new RevenueDashboardResponse.RevenueBreakdownItem(
                    String.valueOf(row[0]), decimalValue(row[1]), longValue(row[2])));
        }
        return items;
    }

    private List<RevenueDashboardResponse.InvoiceStatusItem> getInvoiceStatusBreakdown(
            LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT status, COUNT(*), COALESCE(SUM(final_amount), 0) FROM invoices " +
                "WHERE created_at >= :from AND created_at < :to " +
                "GROUP BY status ORDER BY COUNT(*) DESC");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);

        List<RevenueDashboardResponse.InvoiceStatusItem> items = new ArrayList<>();
        for (Object[] row : (List<Object[]>) query.getResultList()) {
            items.add(new RevenueDashboardResponse.InvoiceStatusItem(
                    String.valueOf(row[0]), longValue(row[1]), decimalValue(row[2])));
        }
        return items;
    }

    private List<RevenueDashboardResponse.RecentPaymentItem> getRecentPayments(
            LocalDateTime from, LocalDateTime toExclusive) {
        Query query = entityManager.createNativeQuery(
                "SELECT p.payment_id, p.payment_code, i.invoice_code, p.payment_type, " +
                "p.payment_method, p.amount, p.status, p.paid_at, u.full_name " +
                "FROM payments p " +
                "LEFT JOIN invoices i ON i.invoice_id = p.invoice_id " +
                "LEFT JOIN users u ON u.user_id = p.paid_by " +
                "WHERE p.status IN ('PAID', 'REFUNDED') AND p.paid_at >= :from AND p.paid_at < :to " +
                "ORDER BY p.paid_at DESC LIMIT 10");
        query.setParameter("from", from);
        query.setParameter("to", toExclusive);

        List<RevenueDashboardResponse.RecentPaymentItem> items = new ArrayList<>();
        for (Object[] row : (List<Object[]>) query.getResultList()) {
            items.add(new RevenueDashboardResponse.RecentPaymentItem(
                    longValue(row[0]),
                    stringValue(row[1]),
                    stringValue(row[2]),
                    stringValue(row[3]),
                    stringValue(row[4]),
                    decimalValue(row[5]),
                    stringValue(row[6]),
                    dateTimeValue(row[7]),
                    stringValue(row[8])));
        }
        return items;
    }

    private BigDecimal decimalValue(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        return new BigDecimal(value.toString());
    }

    private long longValue(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private LocalDate dateValue(Object value) {
        if (value instanceof java.sql.Date date) return date.toLocalDate();
        if (value instanceof LocalDate date) return date;
        return LocalDate.parse(String.valueOf(value));
    }

    private LocalDateTime dateTimeValue(Object value) {
        if (value == null) return null;
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof LocalDateTime dateTime) return dateTime;
        return LocalDateTime.parse(String.valueOf(value).replace(' ', 'T'));
    }

    private static final class RevenueTrendAccumulator {
        private BigDecimal grossRevenue = BigDecimal.ZERO;
        private BigDecimal refundedAmount = BigDecimal.ZERO;
        private long transactionCount;
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
