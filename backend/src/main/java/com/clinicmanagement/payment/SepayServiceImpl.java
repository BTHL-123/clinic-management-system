package com.clinicmanagement.payment;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.SepayQrResponse;
import com.clinicmanagement.payment.dto.SepayWebhookRequest;
import com.clinicmanagement.payment.Payment;
import com.clinicmanagement.payment.PaymentRepository;
import com.clinicmanagement.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SepayServiceImpl implements SepayService {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Value("${sepay.bank-code:}")
    private String bankCode;

    @Value("${sepay.account-number:}")
    private String accountNumber;

    @Value("${sepay.account-name:}")
    private String accountName;

    @Value("${sepay.api-key:}")
    private String apiKey;

    @Override
    @Transactional(readOnly = true)
    public SepayQrResponse generateQr(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy giao dịch thanh toán với ID: " + paymentId));

        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("Chỉ có thể tạo mã QR cho giao dịch đang ở trạng thái PENDING");
        }

        String transferContent = payment.getPaymentCode();
        // Construct the VietQR URL via SePay
        String qrCodeUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&amount=%s&des=%s",
                bankCode, accountNumber, payment.getAmount().toBigInteger().toString(), transferContent);

        return new SepayQrResponse(
                payment.getPaymentId(),
                payment.getAmount(),
                payment.getPaymentCode(),
                transferContent,
                bankCode,
                accountName,
                accountNumber,
                qrCodeUrl);
    }

    @Override
    @Transactional
    public ApiResponse<String> processWebhook(SepayWebhookRequest request, String authorizationHeader) {
        log.info("Received SePay webhook: {}", request);

        // Strict API Key Validation
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("change-this-api-key-to-match-sepay")) {
            log.error(
                    "SEPAY_API_KEY is not properly configured in the environment variables. Webhook processing is disabled for security.");
            return ApiResponse.success("Lỗi cấu hình hệ thống: Thiếu API Key", "INTERNAL_SERVER_ERROR");
        }

        String expectedBearer = "Bearer " + apiKey;
        String expectedApikey = "Apikey " + apiKey;

        if (authorizationHeader == null ||
                (!authorizationHeader.equals(expectedBearer) && !authorizationHeader.equals(expectedApikey)
                        && !authorizationHeader.equals(apiKey))) {
            log.warn("Invalid API Key in webhook request. Provided header: {}",
                    authorizationHeader != null ? "***" : "null");
            return ApiResponse.success("Unauthorized Webhook", "UNAUTHORIZED");
        }

        if (request == null || request.content() == null) {
            return ApiResponse.success("Bỏ qua giao dịch không có nội dung", "IGNORED");
        }

        // Tìm paymentCode trong nội dung chuyển khoản (có thể là PAY-XXXXX hoặc chỉ có
        // mã)
        // Chúng ta giả định format paymentCode là PAY- cộng với 8 ký tự alphanumeric,
        // ví dụ: PAY-1234ABCD
        String content = request.content().toUpperCase();
        Pattern pattern = Pattern.compile("(PAY-[A-Z0-9]+)");
        Matcher matcher = pattern.matcher(content);

        String extractedCode = null;
        if (matcher.find()) {
            extractedCode = matcher.group(1);
        } else {
            // Nếu không match được PAY-, thử tìm xem có payment nào map với toàn bộ hoặc
            // một phần content không.
            // Trong thực tế người dùng có thể nhập nhầm PAY1234 thay vì PAY-1234
            extractedCode = extractCodeFallback(content);
        }

        if (extractedCode == null) {
            log.warn("Không tìm thấy mã thanh toán hợp lệ trong nội dung: {}", request.content());
            return ApiResponse.success("Không khớp mã thanh toán nào", "IGNORED");
        }

        Optional<Payment> paymentOpt = paymentRepository.findByPaymentCode(extractedCode);
        if (paymentOpt.isEmpty()) {
            log.warn("Không tìm thấy giao dịch với mã: {}", extractedCode);
            return ApiResponse.success("Không tìm thấy giao dịch", "NOT_FOUND");
        }

        Payment payment = paymentOpt.get();

        // Kiểm tra double callback
        if ("PAID".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch {} đã được xử lý trước đó", payment.getPaymentCode());
            return ApiResponse.success("Giao dịch đã được xử lý", "SUCCESS");
        }

        // Kiểm tra số tiền
        if (request.transferAmount() == null || request.transferAmount().compareTo(payment.getAmount()) < 0) {
            log.warn("Số tiền chuyển khoản ({}) không đủ so với yêu cầu ({}) cho mã {}",
                    request.transferAmount(), payment.getAmount(), payment.getPaymentCode());
            // Có thể update trạng thái thành PARTIAL hoặc FAILED, nhưng theo thiết kế hiện
            // tại ta để nguyên PENDING
            return ApiResponse.success("Số tiền chuyển khoản không hợp lệ", "INVALID_AMOUNT");
        }

        // Hợp lệ -> Gọi lại processCallback hiện có để dùng chung logic publish event,
        // cập nhật hóa đơn, v.v.
        PaymentCallbackRequest callbackRequest = new PaymentCallbackRequest(
                request.referenceCode() != null ? request.referenceCode()
                        : (request.id() != null ? request.id().toString() : "SEPAY"),
                payment.getPaymentCode(),
                "PAID",
                request.transferAmount());

        paymentService.processCallback(callbackRequest);
        log.info("Xử lý thành công webhook cho mã {}", payment.getPaymentCode());

        return ApiResponse.success("Xử lý thành công", "SUCCESS");
    }

    private String extractCodeFallback(String content) {
        // Có thể thêm logic tìm kiếm linh hoạt hơn ở đây
        // VD: nếu user nhập PAY12345678, chuyển thành PAY-12345678
        Pattern pattern = Pattern.compile("PAY([A-Z0-9]+)");
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return "PAY-" + matcher.group(1);
        }
        return null;
    }
}
