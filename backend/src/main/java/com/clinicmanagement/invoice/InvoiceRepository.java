package com.clinicmanagement.invoice;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findTopByOrderByInvoiceIdDesc();

    Optional<Invoice> findByAppointmentId(Long appointmentId);

    Page<Invoice> findAllByPatientPatientId(Long patientId, Pageable pageable);

    Page<Invoice> findAllByStatus(String status, Pageable pageable);
}
