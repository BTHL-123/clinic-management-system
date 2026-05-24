package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.payment.dto.CreateOnlinePaymentUrlRequest;
import com.clinicmanagement.payment.dto.CreatePaymentRequest;
import com.clinicmanagement.payment.dto.OnlinePaymentUrlResponse;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.PaymentResponse;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> getAll(
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) Long appointmentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(paymentService.getAll(invoiceId, appointmentId, status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        PaymentResponse response = paymentService.create(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo thanh toán thành công", response));
    }

    @PutMapping("/{id}/confirm-cash")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmCash(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        PaymentResponse response = paymentService.confirmCash(id, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán tiền mặt thành công", response));
    }

    @PostMapping("/online/create-url")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<OnlinePaymentUrlResponse>> createOnlineUrl(
            @Valid @RequestBody CreateOnlinePaymentUrlRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        OnlinePaymentUrlResponse response = paymentService.createOnlineUrl(request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Tạo link thanh toán thành công", response));
    }

    @PostMapping("/online/callback")
    public ResponseEntity<ApiResponse<PaymentResponse>> processCallback(
            @Valid @RequestBody PaymentCallbackRequest request
    ) {
        PaymentResponse response = paymentService.processCallback(request);
        return ResponseEntity.ok(ApiResponse.success("Xử lý callback thành công", response));
    }
}
