package com.clinicmanagement.invoice;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
    void deleteAllByInvoice(Invoice invoice);
}
