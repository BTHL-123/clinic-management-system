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
        List<InvoiceItemResponse> items
) {
    public static InvoiceDetailResponse from(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems().stream()
                .map(InvoiceItemResponse::from)
                .toList();

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
