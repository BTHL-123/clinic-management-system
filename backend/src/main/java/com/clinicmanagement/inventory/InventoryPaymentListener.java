package com.clinicmanagement.inventory;

import com.clinicmanagement.common.event.PaymentCompletedEvent;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceItem;
import com.clinicmanagement.invoice.InvoiceRepository;
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

        for (InvoiceItem item : invoice.getItems()) {
            if ("MEDICINE".equalsIgnoreCase(item.getItemType()) && item.getReferenceId() != null) {
                Long medicineId = item.getReferenceId();
                Integer quantity = item.getQuantity();
                String note = "Xuất thuốc cho hóa đơn " + invoice.getInvoiceCode();
                
                inventoryService.exportStockAutomated(medicineId, quantity, "INVOICE", invoiceId, note);
            }
        }
    }
}
