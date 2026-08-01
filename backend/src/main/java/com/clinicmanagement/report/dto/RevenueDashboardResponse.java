package com.clinicmanagement.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record RevenueDashboardResponse(
        LocalDate from,
        LocalDate to,
        BigDecimal grossRevenue,
        BigDecimal refundedAmount,
        BigDecimal netRevenue,
        BigDecimal previousNetRevenue,
        BigDecimal revenueGrowthRate,
        Long successfulPayments,
        Long paidInvoices,
        BigDecimal averagePayment,
        BigDecimal outstandingAmount,
        Long outstandingInvoices,
        BigDecimal pendingRefundAmount,
        Long pendingRefunds,
        List<RevenueTrendPoint> trend,
        List<RevenueBreakdownItem> paymentMethods,
        List<RevenueBreakdownItem> paymentTypes,
        List<InvoiceStatusItem> invoiceStatuses,
        List<RecentPaymentItem> recentPayments
) {
    public record RevenueTrendPoint(
            LocalDate date,
            BigDecimal grossRevenue,
            BigDecimal refundedAmount,
            BigDecimal netRevenue,
            Long transactionCount
    ) {
    }

    public record RevenueBreakdownItem(
            String key,
            BigDecimal amount,
            Long count
    ) {
    }

    public record InvoiceStatusItem(
            String status,
            Long count,
            BigDecimal amount
    ) {
    }

    public record RecentPaymentItem(
            Long paymentId,
            String paymentCode,
            String invoiceCode,
            String paymentType,
            String paymentMethod,
            BigDecimal amount,
            String status,
            LocalDateTime paidAt,
            String payerName
    ) {
    }
}
