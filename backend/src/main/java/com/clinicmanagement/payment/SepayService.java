package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.payment.dto.SepayQrResponse;
import com.clinicmanagement.payment.dto.SepayWebhookRequest;

public interface SepayService {
    SepayQrResponse generateQr(Long paymentId);
    ApiResponse<String> processWebhook(SepayWebhookRequest request, String authorizationHeader);
}
