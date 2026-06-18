package com.clinicmanagement.invoice;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.invoice.dto.CreateInvoiceRequest;
import com.clinicmanagement.invoice.dto.InvoiceDetailResponse;
import com.clinicmanagement.invoice.dto.UpdateInvoiceRequest;
import com.clinicmanagement.invoice.dto.InvoiceResponse;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface InvoiceService {

    PageResponse<InvoiceResponse> getAll(Long patientId, Long appointmentId, String status, Pageable pageable);

    InvoiceDetailResponse getById(Long id);

    InvoiceResponse create(CreateInvoiceRequest request, User currentUser);

    InvoiceResponse update(Long id, UpdateInvoiceRequest request);

    InvoiceResponse cancel(Long id);

    PageResponse<InvoiceResponse> getMyInvoices(User currentUser, Pageable pageable);

    InvoiceResponse generateFromConsultation(Long consultationId);
}
