package com.clinicmanagement.appointment.dto;

import com.clinicmanagement.payment.dto.PaymentResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookAppointmentResponse(
        AppointmentResponse appointment,
        PaymentResponse depositPayment,
        String paymentUrl,
        LocalDateTime expiresAt,
        BigDecimal amount
) {
}
