package com.clinicmanagement.payment.dto;

import com.clinicmanagement.payment.Refund;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundResponse(
        Long refundId,
        String refundCode,
        Long paymentId,
        String paymentCode,
        BigDecimal refundAmount,
        String reason,
        String status,
        String requestedByName,
        String approvedByName,
        LocalDateTime requestedAt,
        LocalDateTime approvedAt,
        LocalDateTime completedAt
) {
    public static RefundResponse from(Refund refund) {
        return new RefundResponse(
                refund.getRefundId(),
                refund.getRefundCode(),
                refund.getPayment().getPaymentId(),
                refund.getPayment().getPaymentCode(),
                refund.getRefundAmount(),
                refund.getReason(),
                refund.getStatus(),
                refund.getRequestedBy() != null ? refund.getRequestedBy().getFullName() : null,
                refund.getApprovedBy() != null ? refund.getApprovedBy().getFullName() : null,
                refund.getRequestedAt(),
                refund.getApprovedAt(),
                refund.getCompletedAt()
        );
    }
}
