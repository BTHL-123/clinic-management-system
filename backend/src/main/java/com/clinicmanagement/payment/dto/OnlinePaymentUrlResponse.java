package com.clinicmanagement.payment.dto;

public record OnlinePaymentUrlResponse(
        Long paymentId,
        String paymentUrl
) {}
