package com.clinicmanagement.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRefundRequest(
        @NotBlank(message = "Vui lòng nhập lý do từ chối")
        String rejectReason
) {}
