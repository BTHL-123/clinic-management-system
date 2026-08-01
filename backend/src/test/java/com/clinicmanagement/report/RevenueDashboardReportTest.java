package com.clinicmanagement.report;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.clinicmanagement.payment.Payment;
import com.clinicmanagement.payment.PaymentRepository;
import com.clinicmanagement.payment.Refund;
import com.clinicmanagement.payment.RefundRepository;
import com.clinicmanagement.report.dto.RevenueDashboardResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RevenueDashboardReportTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Test
    void calculatesNetRevenueAndBreakdownsFromCompletedTransactions() {
        LocalDate today = LocalDate.now();
        LocalDateTime paidAt = today.atTime(10, 30);

        Payment payment = new Payment();
        payment.setPaymentCode("PAY-REPORT-001");
        payment.setPaymentType("FINAL_PAYMENT");
        payment.setPaymentMethod("CASH");
        payment.setAmount(new BigDecimal("1000000.00"));
        payment.setStatus("PAID");
        payment.setPaidAt(paidAt);
        payment = paymentRepository.saveAndFlush(payment);

        Refund completedRefund = new Refund();
        completedRefund.setPayment(payment);
        completedRefund.setRefundCode("REF-REPORT-001");
        completedRefund.setRefundAmount(new BigDecimal("200000.00"));
        completedRefund.setStatus("COMPLETED");
        completedRefund.setCompletedAt(today.atTime(12, 0));
        refundRepository.save(completedRefund);

        Refund pendingRefund = new Refund();
        pendingRefund.setPayment(payment);
        pendingRefund.setRefundCode("REF-REPORT-002");
        pendingRefund.setRefundAmount(new BigDecimal("100000.00"));
        pendingRefund.setStatus("PENDING");
        refundRepository.saveAndFlush(pendingRefund);

        RevenueDashboardResponse report = reportService.getRevenueDashboard(today, today);

        assertEquals(0, new BigDecimal("1000000.00").compareTo(report.grossRevenue()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(report.refundedAmount()));
        assertEquals(0, new BigDecimal("800000.00").compareTo(report.netRevenue()));
        assertEquals(1L, report.successfulPayments());
        assertEquals(0, new BigDecimal("100000.00").compareTo(report.pendingRefundAmount()));
        assertEquals(1L, report.pendingRefunds());
        assertEquals(1, report.trend().size());
        assertEquals(1, report.paymentMethods().size());
        assertEquals("CASH", report.paymentMethods().getFirst().key());
        assertEquals(1, report.recentPayments().size());
        assertNull(report.revenueGrowthRate());
    }
}
