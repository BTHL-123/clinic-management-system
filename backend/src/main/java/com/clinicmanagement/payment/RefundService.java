package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.invoice.Invoice;
import com.clinicmanagement.invoice.InvoiceRepository;
import com.clinicmanagement.payment.dto.CreateRefundRequest;
import com.clinicmanagement.payment.dto.RefundResponse;
import com.clinicmanagement.user.User;
import java.time.LocalDateTime;
import java.util.ArrayList;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface RefundService {

    PageResponse<RefundResponse> getAll(Long paymentId, String status, Pageable pageable);

    RefundResponse getById(Long id);

    RefundResponse create(CreateRefundRequest request, User currentUser);

    RefundResponse approve(Long refundId, User currentUser);

    RefundResponse reject(Long refundId, User currentUser);

    RefundResponse requestRefund(CreateRefundRequest request, User currentUser);
}
