package com.clinicmanagement.common.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PaymentCompletedEvent {
    private final Long paymentId;
    private final Long invoiceId;
    private final String paymentCode;
}
