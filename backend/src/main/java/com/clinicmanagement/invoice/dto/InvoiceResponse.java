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
        LocalDateTime paidAt
) {
    public static InvoiceResponse from(Invoice invoice) {
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
                invoice.getPaidAt()
        );
    }
}
