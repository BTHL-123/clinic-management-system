package com.clinicmanagement.invoice.dto;

import com.clinicmanagement.invoice.Invoice;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvoiceResponse(
        Long invoiceId,
        String invoiceCode,
        Long patientId,
        String patientName,
        Long appointmentId,
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        String paymentStatus
) {
    public static InvoiceResponse from(Invoice invoice) {
        return from(invoice, BigDecimal.ZERO);
    }

    public static InvoiceResponse from(Invoice invoice, BigDecimal paidAmount) {
        BigDecimal normalizedPaid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        BigDecimal remainingAmount = invoice.getFinalAmount().subtract(normalizedPaid);
        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            remainingAmount = BigDecimal.ZERO;
        }
        return new InvoiceResponse(
                invoice.getInvoiceId(),
                invoice.getInvoiceCode(),
                invoice.getPatient().getPatientId(),
                invoice.getPatient().getFullName(),
                invoice.getAppointmentId(),
                invoice.getTotalAmount(),
                invoice.getDiscountAmount(),
                invoice.getFinalAmount(),
                invoice.getStatus(),
                invoice.getCreatedAt(),
                invoice.getPaidAt(),
                normalizedPaid,
                remainingAmount,
                invoice.getStatus()
        );
    }
}
