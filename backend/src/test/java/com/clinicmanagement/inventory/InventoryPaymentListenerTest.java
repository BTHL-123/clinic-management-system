package com.clinicmanagement.inventory;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clinicmanagement.common.event.PaymentCompletedEvent;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceItem;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.prescription.PrescriptionRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InventoryPaymentListenerTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InventoryService inventoryService;
    @Mock private StockTransactionRepository transactionRepository;
    @Mock private ConsultationSessionRepository consultationSessionRepository;
    @Mock private PrescriptionRepository prescriptionRepository;

    private InventoryPaymentListener listener;

    @BeforeEach
    void setUp() {
        listener = new InventoryPaymentListener(
                invoiceRepository,
                inventoryService,
                transactionRepository,
                consultationSessionRepository,
                prescriptionRepository
        );
    }

    @Test
    void paidInvoiceDoesNotDeductMedicineThatWillBeDispensedFromPrescription() {
        Invoice invoice = medicineInvoice(10L, 20L, 30L, 6);
        ConsultationSession session = new ConsultationSession();
        session.setConsultationId(40L);

        when(transactionRepository.existsByReferenceTypeAndReferenceId("INVOICE", 10L)).thenReturn(false);
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoice));
        when(consultationSessionRepository.findByAppointmentId(20L)).thenReturn(Optional.of(session));
        when(prescriptionRepository.existsByConsultationId(40L)).thenReturn(true);

        listener.handlePaymentCompletedEvent(new PaymentCompletedEvent(1L, 10L, "PAY-1"));

        verify(inventoryService, never()).exportStockAutomated(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString()
        );
    }

    @Test
    void paidStandaloneMedicineInvoiceStillDeductsStock() {
        Invoice invoice = medicineInvoice(11L, null, 31L, 6);

        when(transactionRepository.existsByReferenceTypeAndReferenceId("INVOICE", 11L)).thenReturn(false);
        when(invoiceRepository.findById(11L)).thenReturn(Optional.of(invoice));

        listener.handlePaymentCompletedEvent(new PaymentCompletedEvent(2L, 11L, "PAY-2"));

        verify(inventoryService).exportStockAutomated(
                31L,
                6,
                "INVOICE",
                11L,
                "Xuất thuốc cho hóa đơn INV-11"
        );
    }

    private Invoice medicineInvoice(Long invoiceId, Long appointmentId, Long medicineId, int quantity) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceId(invoiceId);
        invoice.setInvoiceCode("INV-" + invoiceId);
        invoice.setAppointmentId(appointmentId);

        InvoiceItem item = new InvoiceItem();
        item.setInvoice(invoice);
        item.setItemType("MEDICINE");
        item.setReferenceId(medicineId);
        item.setQuantity(quantity);
        invoice.setItems(List.of(item));
        return invoice;
    }
}
