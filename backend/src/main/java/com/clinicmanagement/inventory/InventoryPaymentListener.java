package com.clinicmanagement.inventory;

import com.clinicmanagement.common.event.PaymentCompletedEvent;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceItem;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import com.clinicmanagement.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class InventoryPaymentListener {

    private final InvoiceRepository invoiceRepository;
    private final InventoryService inventoryService;
    private final StockTransactionRepository transactionRepository;
    private final ConsultationSessionRepository consultationSessionRepository;
    private final PrescriptionRepository prescriptionRepository;

    @EventListener
    @Transactional
    public void handlePaymentCompletedEvent(PaymentCompletedEvent event) {
        Long invoiceId = event.getInvoiceId();
        if (invoiceId == null) return;

        // Prevent double deduction by checking if INVOICE transaction already exists
        if (transactionRepository.existsByReferenceTypeAndReferenceId("INVOICE", invoiceId)) {
            return;
        }

        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null) return;

        // Medicines prescribed during a consultation are deducted only when the
        // pharmacist dispenses the prescription. Payment must not deduct them again.
        boolean dispensedThroughPrescription = invoice.getAppointmentId() != null
                && consultationSessionRepository.findByAppointmentId(invoice.getAppointmentId())
                .map(session -> prescriptionRepository.existsByConsultationId(session.getConsultationId()))
                .orElse(false);

        for (InvoiceItem item : invoice.getItems()) {
            if (!dispensedThroughPrescription
                    && "MEDICINE".equalsIgnoreCase(item.getItemType())
                    && item.getReferenceId() != null) {
                Long medicineId = item.getReferenceId();
                Integer quantity = item.getQuantity();
                String note = "Xuất thuốc cho hóa đơn " + invoice.getInvoiceCode();

                inventoryService.exportStockAutomated(medicineId, quantity, "INVOICE", invoiceId, note);
            }
        }
    }
}
