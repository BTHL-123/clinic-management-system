package com.clinicmanagement.invoice.dto;

import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceDetailResponse(
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
        String paymentStatus,
        List<InvoiceItemResponse> items
) {
    public static InvoiceDetailResponse from(Invoice invoice) {
        return from(invoice, BigDecimal.ZERO);
    }

    public static InvoiceDetailResponse from(Invoice invoice, BigDecimal paidAmount) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems().stream()
                .map(InvoiceItemResponse::from)
                .toList();

        BigDecimal normalizedPaid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        BigDecimal remainingAmount = invoice.getFinalAmount().subtract(normalizedPaid);
        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            remainingAmount = BigDecimal.ZERO;
        }

        return new InvoiceDetailResponse(
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
                invoice.getStatus(),
                itemResponses
        );
    }

    public record InvoiceItemResponse(
            Long invoiceItemId,
            String itemType,
            Long referenceId,
            String itemName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice
    ) {
        public static InvoiceItemResponse from(InvoiceItem item) {
            return new InvoiceItemResponse(
                    item.getInvoiceItemId(),
                    item.getItemType(),
                    item.getReferenceId(),
                    item.getItemName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getTotalPrice()
            );
        }
    }
}
