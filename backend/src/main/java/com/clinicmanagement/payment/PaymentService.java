package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.payment.dto.CreateOnlinePaymentUrlRequest;
import com.clinicmanagement.payment.dto.CreatePaymentRequest;
import com.clinicmanagement.payment.dto.OnlinePaymentUrlResponse;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.PaymentResponse;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface PaymentService {

    PageResponse<PaymentResponse> getAll(Long invoiceId, Long appointmentId, String status, Long patientId, Pageable pageable);

    PaymentResponse getById(Long id);

    PaymentResponse getMyPaymentById(Long id, User currentUser);

    PaymentResponse create(CreatePaymentRequest request, User currentUser);

    PaymentResponse confirmCash(Long paymentId, User currentUser);

    OnlinePaymentUrlResponse createOnlineUrl(CreateOnlinePaymentUrlRequest request, User currentUser);

    PaymentResponse processCallback(PaymentCallbackRequest request);
}
