package com.clinicmanagement.aichat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.primary-model:gemini-2.5-flash}")
    private String primaryModel;

    @Value("${app.gemini.fallback-model:gemini-2.0-flash}")
    private String fallbackModel;

    @Value("${app.ai.provider:groq}")
    private String aiProvider;

    @Value("${app.groq.api-key:}")
    private String groqApiKey;

    @Value("${app.groq.primary-model:llama-3.3-70b-versatile}")
    private String groqPrimaryModel;

    @Value("${app.groq.fallback-model:llama-3.1-8b-instant}")
    private String groqFallbackModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    /**
     * Gọi Gemini API với retry và fallback.
     * Trả về String[2]: [0] = text response, [1] = model đã dùng (primaryModel hoặc fallbackModel).
     * Trả về null nếu tất cả đều thất bại.
     */
    private String[] executeWithRetryAndFallback(Map<String, Object> requestBody) {
        String[] modelsToTry = {primaryModel, fallbackModel};
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> contentsList = (List<Map<String, Object>>) requestBody.get("contents");
        int messageCount = contentsList != null ? contentsList.size() : 0;

        // Chỉ bật khi dev/debug
        log.debug("Raw Gemini payload (chỉ bật khi dev/debug): {}", requestBody);

        int lastErrorCode = 0;

        for (String currentModel : modelsToTry) {
            log.info("USING GEMINI API - Model: {}, Messages Count: {}", currentModel, messageCount);
            String url = String.format(GEMINI_API_URL, currentModel, apiKey);
            // Log endpoint (ẩn API key)
            log.info("Gemini Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent", currentModel);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            int maxRetries = 3;
            int attempt = 0;
            long backoff = 1000;

            while (attempt < maxRetries) {
                attempt++;
                try {
                    long startTime = System.currentTimeMillis();
                    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                    long duration = System.currentTimeMillis() - startTime;

                    JsonNode root = objectMapper.readTree(response.getBody());

                    if (root.has("candidates") && root.get("candidates").isArray() && root.get("candidates").size() > 0) {
                        JsonNode candidate = root.get("candidates").get(0);
                        if (candidate.has("content") && candidate.get("content").has("parts")) {
                            JsonNode parts = candidate.get("content").get("parts");
                            if (parts.isArray() && parts.size() > 0) {
                                String source = currentModel.equals(primaryModel) ? "GEMINI_PRIMARY" : "GEMINI_FALLBACK";
                                log.info("AI_RESPONSE_SOURCE={} - Model: {}. Time taken: {}ms", source, currentModel, duration);
                                return new String[]{parts.get(0).get("text").asText(), currentModel};
                            }
                        }
                    }
                    break;
                } catch (org.springframework.web.client.HttpStatusCodeException e) {
                    int statusCode = e.getStatusCode().value();
                    lastErrorCode = statusCode;
                    String responseBody = e.getResponseBodyAsString();

                    if (statusCode == 429) {
                        // Rate limit: log đầy đủ, không retry, break ngay
                        log.warn("Gemini API Error. Status={}, Model={}, ResponseBody={}",
                                statusCode, currentModel, responseBody);
                        log.warn("GEMINI_429_DETECTED - check quota/rate limit in Google AI Studio");
                        break;
                    } else if (statusCode >= 500) {
                        // Server error (503, 500...): retry với backoff 1s → 2s → 4s
                        log.warn("Gemini API Error. Status={}, Model={}, Attempt={}/{}, ResponseBody={}",
                                statusCode, currentModel, attempt, maxRetries, responseBody);
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(backoff);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                            backoff *= 2;
                        }
                    } else {
                        // Other 4xx (400, 403...): log response body, không retry
                        log.error("Gemini API Error. Status={}, Model={}, ResponseBody={}",
                                statusCode, currentModel, responseBody);
                        break;
                    }
                } catch (Exception e) {
                    log.error("Gemini API General Error. Model: {}, Attempt {}/{}", currentModel, attempt, maxRetries, e);
                    if (attempt < maxRetries) {
                        try {
                            Thread.sleep(backoff);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                        backoff *= 2;
                    }
                }
            }

            log.warn("Model {} failed after {} attempts.", currentModel, attempt);

            // 429 = rate limit trên toàn API key → skip fallback model vì cùng quota
            if (lastErrorCode == 429) {
                log.warn("AI_RESPONSE_SOURCE=MOCK_CHAT due to GEMINI_429. Skipping fallback models.");
                break;
            }
        }
        
        if (lastErrorCode != 429) {
            log.error("AI_RESPONSE_SOURCE=MOCK_CHAT due to ALL_MODELS_FAILED");
        }
        return null;
    }

    // ==================== GROQ API (OpenAI-compatible) ====================

    private String[] executeGroqWithRetryAndFallback(Map<String, Object> requestBody) {
        String[] modelsToTry = {groqPrimaryModel, groqFallbackModel};

        @SuppressWarnings("unchecked")
        List<?> messagesList = (List<?>) requestBody.get("messages");
        int messageCount = messagesList != null ? messagesList.size() : 0;

        log.debug("Raw Groq payload (chỉ bật khi dev/debug): {}", requestBody);

        int lastErrorCode = 0;

        for (String currentModel : modelsToTry) {
            requestBody.put("model", currentModel);
            log.info("AI_PROVIDER=GROQ - Model: {}, Messages Count: {}", currentModel, messageCount);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            int maxRetries = 3;
            int attempt = 0;
            long backoff = 1000;

            while (attempt < maxRetries) {
                attempt++;
                try {
                    long startTime = System.currentTimeMillis();
                    ResponseEntity<String> response = restTemplate.postForEntity(GROQ_API_URL, request, String.class);
                    long duration = System.currentTimeMillis() - startTime;

                    JsonNode root = objectMapper.readTree(response.getBody());

                    if (root.has("choices") && root.get("choices").isArray() && root.get("choices").size() > 0) {
                        JsonNode choice = root.get("choices").get(0);
                        if (choice.has("message") && choice.get("message").has("content")) {
                            String content = choice.get("message").get("content").asText();
                            String source = currentModel.equals(groqPrimaryModel) ? "GROQ_PRIMARY" : "GROQ_FALLBACK";
                            log.info("AI_RESPONSE_SOURCE={} - Model: {}. Time taken: {}ms", source, currentModel, duration);
                            return new String[]{content, currentModel};
                        }
                    }
                    break;
                } catch (org.springframework.web.client.HttpStatusCodeException e) {
                    int statusCode = e.getStatusCode().value();
                    lastErrorCode = statusCode;
                    String responseBody = e.getResponseBodyAsString();

                    if (statusCode == 429) {
                        log.warn("Groq API Error. Status={}, Model={}, ResponseBody={}", statusCode, currentModel, responseBody);
                        log.warn("GROQ_429_DETECTED - check rate limit at console.groq.com");
                        break;
                    } else if (statusCode >= 500) {
                        log.warn("Groq API Error. Status={}, Model={}, Attempt={}/{}, ResponseBody={}", statusCode, currentModel, attempt, maxRetries, responseBody);
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(backoff);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                            backoff *= 2;
                        }
                    } else {
                        log.error("Groq API Error. Status={}, Model={}, ResponseBody={}", statusCode, currentModel, responseBody);
                        break;
                    }
                } catch (Exception e) {
                    log.error("Groq API General Error. Model: {}, Attempt {}/{}", currentModel, attempt, maxRetries, e);
                    if (attempt < maxRetries) {
                        try {
                            Thread.sleep(backoff);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                        backoff *= 2;
                    }
                }
            }

            log.warn("Groq Model {} failed after {} attempts.", currentModel, attempt);
        }

        log.error("AI_RESPONSE_SOURCE=MOCK_CHAT due to GROQ_API_ERROR");
        return null;
    }

    private String chatWithGroq(List<AiChatMessage> history, String newMessage, String activeDepartmentsStr) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to GROQ_API_KEY_MISSING");
            return mockChatReply(history, newMessage);
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là bác sĩ tư vấn y tế của phòng khám. CHỈ HOẠT ĐỘNG TRONG PHẠM VI Y TẾ. Tuân thủ các quy tắc TỐI THƯỢNG sau:\n" +
                "1. PHẠM VI: Nếu ngoài y tế (code, toán, kể chuyện...), từ chối: 'Xin lỗi bạn, tôi là trợ lý y tế nên chỉ hỗ trợ các vấn đề sức khỏe.'\n" +
                "2. QUY TRÌNH HỘI THOẠI:\n" +
                "   - CHƯA ĐỦ DỮ LIỆU: Nhận định ngắn gọn -> Hỏi 1-2 câu quan trọng nhất để làm rõ triệu chứng. Tiếp tục khai thác, không kết thúc sớm.\n" +
                "   - KHI ĐÃ ĐỦ DỮ LIỆU TỐI THIỂU: Phải đưa ra: (A) Đánh giá sơ bộ. (B) Khuyên khám CHUYÊN KHOA CỤ THỂ CHỈ NẰM TRONG DANH SÁCH SAU (" + activeDepartmentsStr + "). TUYỆT ĐỐI KHÔNG nói chung chung 'nên đi khám bác sĩ' hay khuyên các khoa ngoài danh sách. (C) Nêu mức độ ưu tiên khám. (D) Câu chốt: 'Bạn cũng có thể sử dụng chức năng [Nhận gợi ý chuyên khoa] để được hệ thống hỗ trợ thêm.'\n" +
                "3. KHẨN CẤP: Đau dữ dội, kéo dài, khó thở, ngất... -> Cảnh báo cấp cứu/khám ngay lập tức + Vẫn phải gợi ý chuyên khoa phù hợp.\n" +
                "4. CHỐNG LẶP: KHÔNG nhắc lại nguyên văn lời user. KHÔNG dùng câu sáo rỗng 'có thể do nhiều nguyên nhân'. KHÔNG hỏi lại câu y hệt.\n" +
                "5. GIỚI HẠN & VĂN PHONG: Tối đa 120 từ. Chia đoạn ngắn. Không chẩn đoán chắc chắn, không kê đơn. Luôn kết thúc bằng 'Thông tin chỉ mang tính tham khảo.' khi có tư vấn bệnh."));

        List<AiChatMessage> limitedHistory = history;
        if (history.size() > 20) {
            limitedHistory = history.subList(history.size() - 20, history.size());
        }
        for (AiChatMessage msg : limitedHistory) {
            String role = "PATIENT".equalsIgnoreCase(msg.getSenderType()) ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.getMessageText()));
        }

        String enrichedMessage = newMessage;
        if (hasKeyword(newMessage, "bây giờ làm sao", "giờ làm sao", "làm sao đây", "nên làm gì", "phải làm gì", "chữa sao")) {
            enrichedMessage += "\n\n(HỆ THỐNG GHI CHÚ: Bệnh nhân đang hỏi cách xử lý ngay. Hãy đưa hướng dẫn tạm thời ngắn gọn trước, sau đó hỏi thêm 1 câu cần thiết. Không lặp lại nguyên văn câu hỏi trước.)";
        }
        messages.add(Map.of("role", "user", "content", enrichedMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.4);
        requestBody.put("max_tokens", 300);

        String[] result = executeGroqWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0];
        }
        return mockChatReply(history, newMessage);
    }

    private String analyzeSymptomsWithGroq(List<AiChatMessage> history, String activeDepartmentsStr) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to GROQ_API_KEY_MISSING");
            return mockSpecialtySuggestion(history);
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là hệ thống phân tích bệnh án. Đọc lịch sử trò chuyện và trả về ĐÚNG MỘT JSON OBJECT với cấu trúc:\n" +
                "{\n" +
                "  \"recommendations\": [\n" +
                "    { \"departmentName\": \"Tên khoa\", \"confidenceScore\": 85.0, \"explanation\": \"Lý do\" }\n" +
                "  ],\n" +
                "  \"message\": \"\"\n" +
                "}\n" +
                "Quy tắc:\n" +
                "1. Trả về tối đa 3 chuyên khoa phù hợp NHẤT. BẮT BUỘC CHỈ ĐƯỢC CHỌN TỪ DANH SÁCH CÁC KHOA ĐANG CÓ SAU: " + activeDepartmentsStr + ".\n" +
                "2. Nếu có nhiều hệ cơ quan, hãy trả về 2-3 khoa trong danh sách trên.\n" +
                "3. Nếu thông tin mơ hồ (VD: 'tôi mệt'), không ép chọn khoa. Trả về mảng recommendations rỗng và message: 'Thông tin triệu chứng chưa đủ rõ để gợi ý chuyên khoa. Vui lòng mô tả thêm triệu chứng cụ thể.'\n" +
                "4. Nếu input phi y khoa (VD: buồn vì chia tay), trả recommendations rỗng (hoặc Khoa Tâm lý nếu có trong danh sách) và message định hướng lịch sự.\n" +
                "Chỉ trả về JSON hợp lệ, không chứa markdown."));

        StringBuilder combinedText = new StringBuilder();
        for (AiChatMessage msg : history) {
            combinedText.append(msg.getSenderType()).append(": ").append(msg.getMessageText()).append("\n");
        }
        messages.add(Map.of("role", "user", "content", "Lịch sử:\n" + combinedText + "\nPhân tích và trả về JSON."));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);
        requestBody.put("max_tokens", 300);

        String[] result = executeGroqWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0].trim();
        }
        return mockSpecialtySuggestion(history);
    }

    private String standardizeClinicalNoteWithGroq(String rawNote) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to GROQ_API_KEY_MISSING");
            throw new com.clinicmanagement.common.exception.BusinessException("Lỗi: Không tìm thấy GROQ_API_KEY. Vui lòng kiểm tra lại cấu hình biến môi trường.");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là một HỆ THỐNG XỬ LÝ VĂN BẢN tự động (Text Processing System). Nhiệm vụ của bạn là sắp xếp lại đoạn văn bản lộn xộn đầu vào thành một JSON với 5 trường. KHÔNG đưa ra lời khuyên, chỉ sắp xếp lại chữ.\n" +
                "1. 'symptoms': Các biểu hiện, cảm giác hoặc số ngày bị bệnh.\n" +
                "2. 'clinicalFindings': Các đặc điểm quan sát hoặc sờ thấy được.\n" +
                "3. 'diagnosis': Tên bệnh. Nếu có thể, hãy định dạng kèm mã: [MÃ] Tên bệnh.\n" +
                "4. 'treatmentPlan': Hướng giải quyết, đơn thuốc hoặc xét nghiệm.\n" +
                "5. 'doctorNote': Lời dặn dò thêm. Chú ý: Nếu mục 3 có chữ 'nghi', 'theo dõi' thì hãy dời nó xuống mục 5 này.\n" +
                "QUAN TRỌNG: Trả về ĐÚNG MỘT JSON OBJECT chứa 5 trường trên. Nếu không tìm thấy, hãy điền chuỗi rỗng \"\". KHÔNG viết thêm bất kỳ câu chữ nào bên ngoài JSON."));
        messages.add(Map.of("role", "user", "content", "Đoạn văn bản cần sắp xếp thành JSON:\n" + rawNote));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", 500);

        String[] result = executeGroqWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0].trim();
        }
        throw new com.clinicmanagement.common.exception.BusinessException("Lỗi: Không thể kết nối tới Groq API. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.");
    }

    // ==================== PUBLIC ENTRY POINTS ====================

    public String chat(List<AiChatMessage> history, String newMessage, String activeDepartmentsStr) {
        if ("groq".equalsIgnoreCase(aiProvider)) {
            return chatWithGroq(history, newMessage, activeDepartmentsStr);
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to API_KEY_MISSING");
            return mockChatReply(history, newMessage);
        }

        Map<String, Object> requestBody = new HashMap<>();

        // Build system instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> systemParts = new HashMap<>();
        systemParts.put("text", "Bạn là bác sĩ tư vấn y tế của phòng khám. CHỈ HOẠT ĐỘNG TRONG PHẠM VI Y TẾ. Tuân thủ các quy tắc TỐI THƯỢNG sau:\n" +
                "1. PHẠM VI: Nếu ngoài y tế (code, toán, kể chuyện...), từ chối: 'Xin lỗi bạn, tôi là trợ lý y tế nên chỉ hỗ trợ các vấn đề sức khỏe.'\n" +
                "2. QUY TRÌNH HỘI THOẠI:\n" +
                "   - CHƯA ĐỦ DỮ LIỆU: Nhận định ngắn gọn -> Hỏi 1-2 câu quan trọng nhất để làm rõ triệu chứng. Tiếp tục khai thác, không kết thúc sớm.\n" +
                "   - KHI ĐÃ ĐỦ DỮ LIỆU TỐI THIỂU: Phải đưa ra: (A) Đánh giá sơ bộ. (B) Khuyên khám CHUYÊN KHOA CỤ THỂ CHỈ NẰM TRONG DANH SÁCH SAU (" + activeDepartmentsStr + "). TUYỆT ĐỐI KHÔNG nói chung chung 'nên đi khám bác sĩ' hay khuyên các khoa ngoài danh sách. (C) Nêu mức độ ưu tiên khám. (D) Câu chốt: 'Bạn cũng có thể sử dụng chức năng [Nhận gợi ý chuyên khoa] để được hệ thống hỗ trợ thêm.'\n" +
                "3. KHẨN CẤP: Đau dữ dội, kéo dài, khó thở, ngất... -> Cảnh báo cấp cứu/khám ngay lập tức + Vẫn phải gợi ý chuyên khoa phù hợp.\n" +
                "4. CHỐNG LẶP: KHÔNG nhắc lại nguyên văn lời user. KHÔNG dùng câu sáo rỗng 'có thể do nhiều nguyên nhân'. KHÔNG hỏi lại câu y hệt.\n" +
                "5. GIỚI HẠN & VĂN PHONG: Tối đa 120 từ. Chia đoạn ngắn. Không chẩn đoán chắc chắn, không kê đơn. Luôn kết thúc bằng 'Thông tin chỉ mang tính tham khảo.' khi có tư vấn bệnh.");
        systemInstruction.put("parts", List.of(systemParts));
        requestBody.put("system_instruction", systemInstruction);

        List<AiChatMessage> limitedHistory = history;
        if (history.size() > 20) {
            limitedHistory = history.subList(history.size() - 20, history.size());
        }

        // Build contents
        List<Map<String, Object>> contents = new ArrayList<>();
        for (AiChatMessage msg : limitedHistory) {
            Map<String, Object> part = new HashMap<>();
            part.put("text", msg.getMessageText());
            Map<String, Object> content = new HashMap<>();
            content.put("role", "PATIENT".equalsIgnoreCase(msg.getSenderType()) ? "user" : "model");
            content.put("parts", List.of(part));
            contents.add(content);
        }

        String enrichedMessage = newMessage;
        if (hasKeyword(newMessage, "bây giờ làm sao", "giờ làm sao", "làm sao đây", "nên làm gì", "phải làm gì", "chữa sao")) {
            enrichedMessage += "\n\n(HỆ THỐNG GHI CHÚ: Bệnh nhân đang hỏi cách xử lý ngay. Hãy đưa hướng dẫn tạm thời ngắn gọn trước, sau đó hỏi thêm 1 câu cần thiết. Không lặp lại nguyên văn câu hỏi trước.)";
        }

        // Add new message
        Map<String, Object> newPart = new HashMap<>();
        newPart.put("text", enrichedMessage);
        Map<String, Object> newContent = new HashMap<>();
        newContent.put("role", "user");
        newContent.put("parts", List.of(newPart));
        contents.add(newContent);

        requestBody.put("contents", contents);

        String[] result = executeWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0];
        }

        return mockChatReply(history, newMessage);
    }

    public String analyzeSymptoms(List<AiChatMessage> history, String activeDepartmentsStr) {
        if ("groq".equalsIgnoreCase(aiProvider)) {
            return analyzeSymptomsWithGroq(history, activeDepartmentsStr);
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to API_KEY_MISSING");
            return mockSpecialtySuggestion(history);
        }

        Map<String, Object> requestBody = new HashMap<>();

        // System instruction for JSON
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> systemParts = new HashMap<>();
        systemParts.put("text", "Bạn là hệ thống phân tích bệnh án. Đọc lịch sử trò chuyện và trả về ĐÚNG MỘT JSON OBJECT với cấu trúc:\n" +
                "{\n" +
                "  \"recommendations\": [\n" +
                "    { \"departmentName\": \"Tên khoa\", \"confidenceScore\": 85.0, \"explanation\": \"Lý do\" }\n" +
                "  ],\n" +
                "  \"message\": \"\"\n" +
                "}\n" +
                "Quy tắc:\n" +
                "1. Trả về tối đa 3 chuyên khoa phù hợp NHẤT. BẮT BUỘC CHỈ ĐƯỢC CHỌN TỪ DANH SÁCH CÁC KHOA ĐANG CÓ SAU: " + activeDepartmentsStr + ".\n" +
                "2. Nếu có nhiều hệ cơ quan, hãy trả về 2-3 khoa trong danh sách trên.\n" +
                "3. Nếu thông tin mơ hồ (VD: 'tôi mệt'), không ép chọn khoa. Trả về mảng recommendations rỗng và message: 'Thông tin triệu chứng chưa đủ rõ để gợi ý chuyên khoa. Vui lòng mô tả thêm triệu chứng cụ thể.'\n" +
                "4. Nếu input phi y khoa (VD: buồn vì chia tay), trả recommendations rỗng (hoặc Khoa Tâm lý nếu có trong danh sách) và message định hướng lịch sự.\n" +
                "Chỉ trả về JSON hợp lệ, không chứa markdown.");
        systemInstruction.put("parts", List.of(systemParts));
        requestBody.put("system_instruction", systemInstruction);

        // Build contents
        StringBuilder combinedText = new StringBuilder();
        for (AiChatMessage msg : history) {
            combinedText.append(msg.getSenderType()).append(": ").append(msg.getMessageText()).append("\n");
        }

        Map<String, Object> part = new HashMap<>();
        part.put("text", "Lịch sử:\n" + combinedText.toString() + "\nPhân tích và trả về JSON.");
        Map<String, Object> content = new HashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(part));

        requestBody.put("contents", List.of(content));

        String[] result = executeWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0].trim();
        }
        
        return mockSpecialtySuggestion(history);
    }

    public String standardizeClinicalNote(String rawNote) {
        if ("groq".equalsIgnoreCase(aiProvider)) {
            return standardizeClinicalNoteWithGroq(rawNote);
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.info("AI_RESPONSE_SOURCE=MOCK_CHAT due to API_KEY_MISSING");
            throw new com.clinicmanagement.common.exception.BusinessException("Lỗi: Không tìm thấy GEMINI_API_KEY. Vui lòng kiểm tra lại cấu hình biến môi trường.");
        }

        Map<String, Object> requestBody = new HashMap<>();

        // System instruction for JSON
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> systemParts = new HashMap<>();
        systemParts.put("text", "Bạn là một AI CHUYÊN TRÍCH XUẤT THÔNG TIN Y TẾ. Nhiệm vụ của bạn LÀ CHUẨN HÓA GHI CHÚ THÔ thành JSON, TUYỆT ĐỐI KHÔNG tự chẩn đoán, KHÔNG tự kê thuốc, KHÔNG suy diễn.\n" +
                "Đọc ghi chú thô và trích xuất nguyên văn/tóm tắt vào 5 trường sau:\n" +
                "1. 'symptoms': CHỈ triệu chứng cơ năng bệnh nhân tự cảm nhận (VD: đau bụng, ho, sốt...) VÀ thời gian kéo dài triệu chứng (VD: kéo dài 3 ngày nay, xuất hiện từ hôm qua). Bỏ qua các thông tin cá nhân như (Bệnh nhân nam, nữ, tuổi).\n" +
                "2. 'clinicalFindings': Kết quả khám thực thể do bác sĩ khám (VD: ấn đau, phản ứng thành bụng, đề kháng, Murphy (+), Rovsing (+), họng đỏ, phổi ran, tim đều...). Ưu tiên đưa vào đây, không để nhầm vào symptoms.\n" +
                "3. 'diagnosis': Chẩn đoán XÁC ĐỊNH bệnh. Bạn PHẢI tra cứu mã ICD-10 tương ứng và trả về theo định dạng: [MÃ_ICD10] Tên Bệnh (VD: [J02.9] Viêm họng cấp). Chỉ chuyển một chẩn đoán xuống doctorNote khi CHÍNH CỤM CHẨN ĐOÁN đó được bổ nghĩa bởi 'nghi', 'theo dõi', 'rule out', 'chưa loại trừ' hoặc 'khả năng'. KHÔNG được xóa diagnosis chỉ vì các từ này xuất hiện ở câu khác, ví dụ 'theo dõi đáp ứng điều trị'. Nếu ghi chú có 'chẩn đoán xác định: X' và X không mang nghĩa chưa chắc chắn thì BẮT BUỘC điền X vào diagnosis, kể cả chỗ khác có từ 'theo dõi'. Nếu không có chẩn đoán xác định, để rỗng \"\".\n" +
                "4. 'treatmentPlan': Thuốc, KẾ HOẠCH ĐIỀU TRỊ hoặc CẬN LÂM SÀNG (VD: chỉ định, xét nghiệm, siêu âm, CT, MRI, X-quang, công thức máu, nội soi...). Ưu tiên đưa vào đây.\n" +
                "5. 'doctorNote': Lời dặn dò của bác sĩ đối với bệnh nhân (kiêng cữ, sinh hoạt), hoặc các chẩn đoán chưa xác định (VD: nghi viêm ruột thừa). KHÔNG ghi lại thông tin hành chính (bệnh nhân nam, tuổi...) trừ khi cần thiết.\n" +
                "QUAN TRỌNG: Nếu ghi chú chỉ có kế hoạch điều trị, chỉ định, thuốc hoặc lịch tái khám thì vẫn PHẢI điền treatmentPlan/doctorNote tương ứng; không được trả cả 5 trường rỗng khi ghi chú có nội dung y khoa.\n" +
                "Trả về ĐÚNG MỘT JSON OBJECT với 5 trường trên. Nếu thông tin nào không có, hãy để trống chuỗi (\"\"). Chỉ trả về JSON thuần hợp lệ, không bọc bằng ```json hay markdown, không chứa text nào khác.");
        systemInstruction.put("parts", List.of(systemParts));
        requestBody.put("system_instruction", systemInstruction);

        // Build contents
        Map<String, Object> part = new HashMap<>();
        part.put("text", "Ghi chú thô:\n" + rawNote + "\nPhân tích và trả về JSON.");
        Map<String, Object> content = new HashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(part));

        requestBody.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        String[] result = executeWithRetryAndFallback(requestBody);
        if (result != null) {
            return result[0].trim();
        }

        throw new com.clinicmanagement.common.exception.BusinessException("Lỗi: Không thể kết nối tới Gemini API. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.");
    }

    private String mockChatReply(List<AiChatMessage> history, String newMessage) {
        String currentMessage = normalizeText(newMessage);
        String reply = getReplyForSymptoms(currentMessage);
        
        if (reply != null) {
            return reply + " (Lưu ý: Tư vấn này chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.)";
        }

        String lastPatientMessage = "";
        for (int i = history.size() - 1; i >= 0; i--) {
            if ("PATIENT".equalsIgnoreCase(history.get(i).getSenderType())) {
                lastPatientMessage = normalizeText(history.get(i).getMessageText());
                break;
            }
        }
        
        if (asksForSpecialty(currentMessage)) {
            reply = getReplyForSymptoms(lastPatientMessage);
            if (reply != null) {
                return "Dựa trên triệu chứng bạn vừa nêu: " + reply + " (Lưu ý: Tư vấn này chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.)";
            }
            return "Hiện thông tin triệu chứng còn ít nên tôi chưa thể chọn chuyên khoa thật chắc. Nếu phải chọn ngay, bạn nên chọn Khám tổng quát để bác sĩ sàng lọc ban đầu. (Lưu ý: Tư vấn này chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.)";
        }
        
        return "Tôi đã ghi nhận thông tin của bạn. Bạn có thể nói rõ hơn triệu chứng bắt đầu từ khi nào, mức độ nặng nhẹ, và bạn đã dùng thuốc gì chưa? Tôi sẽ dựa vào đó để gợi ý chuyên khoa phù hợp. (Lưu ý: Tư vấn này chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.)";
    }

    private String getReplyForSymptoms(String text) {
        boolean isSevereChest = hasKeyword(text, "đau ngực", "dau nguc") && hasKeyword(text, "khó thở", "kho tho");
        boolean isSevereBleeding = hasKeyword(text, "cầu ra máu", "cau ra mau", "ngoài ra máu", "ngoai ra mau", "ỉa ra máu", "ia ra mau");
        boolean isSevereAllergy = hasKeyword(text, "dị ứng", "di ung") && hasKeyword(text, "khó thở", "kho tho", "sưng môi", "sung moi", "sưng mặt", "sung mat");
        boolean isSevereHeadache = hasKeyword(text, "đau đầu", "dau dau") && hasKeyword(text, "dữ dội", "du doi", "đột ngột", "dot ngot", "yếu liệt", "yeu liet", "tê nửa người", "te nua nguoi");

        if (isSevereChest) {
            return "CẢNH BÁO: Tình trạng đau ngực kèm khó thở là dấu hiệu rất nguy hiểm có thể liên quan đến nhồi máu cơ tim. Bạn cần TỚI NGAY PHÒNG CẤP CỨU gần nhất hoặc gọi cấp cứu 115.";
        }
        if (hasKeyword(text, "gãy xương", "gay xuong", "chấn thương nặng", "chan thuong nang")) {
            return "CẢNH BÁO: Nghi ngờ gãy xương hoặc chấn thương nặng cần được cố định và chụp X-quang ngay. Vui lòng đến thẳng khoa Cấp cứu hoặc Ngoại khoa/Chấn thương chỉnh hình.";
        }
        if (isSevereHeadache) {
            return "CẢNH BÁO: Đau đầu dữ dội đột ngột hoặc kèm tê yếu có thể là dấu hiệu đột quỵ. Bạn cần đi cấp cứu Thần kinh ngay lập tức.";
        }
        if (isSevereAllergy) {
            return "CẢNH BÁO: Dị ứng kèm sưng mặt, sưng môi hoặc khó thở là dấu hiệu sốc phản vệ cực kỳ nguy hiểm. Cần gọi cấp cứu hoặc đến cơ sở y tế gần nhất ngay lập tức.";
        }
        if (hasKeyword(text, "tiểu ra máu", "tieu ra mau", "đái ra máu", "dai ra mau")) {
            return "CẢNH BÁO: Tiểu ra máu là dấu hiệu bất thường của hệ tiết niệu. Bạn cần đi khám Nội khoa hoặc Tiết niệu càng sớm càng tốt để siêu âm và xét nghiệm.";
        }
        if (isSevereBleeding) {
            return "CẢNH BÁO: Đi ngoài ra máu là dấu hiệu cần được nội soi trực tràng sớm. Đề nghị bạn đi khám chuyên khoa Tiêu hóa ngay trong ngày.";
        }

        if (hasChestOrBreathingSymptoms(text)) {
            return "Bạn đang mô tả triệu chứng có thể liên quan tim mạch hoặc hô hấp. Nếu đau ngực dữ dội, khó thở nhiều, tim đập nhanh, vã mồ hôi hoặc choáng, bạn nên đi cấp cứu ngay. Nếu triệu chứng nhẹ hơn, tôi gợi ý bạn đặt lịch khám Tim mạch để được kiểm tra.";
        }
        if (hasNeurologicalSymptoms(text)) {
            return "Các triệu chứng như đau đầu, chóng mặt hoặc tê bì tay chân thường liên quan đến Thần kinh. Bạn nên nghỉ ngơi và đặt lịch khám chuyên khoa Thần kinh nếu triệu chứng kéo dài hoặc tăng nặng.";
        }
        if (hasPsychologicalSymptoms(text)) {
            return "Tình trạng mất ngủ kéo dài, căng thẳng hoặc lo âu ảnh hưởng rất lớn đến sức khỏe tinh thần. Bạn nên sắp xếp khám chuyên khoa Thần kinh hoặc Tâm lý để được hỗ trợ.";
        }
        if (hasEyeSymptoms(text)) {
            return "Triệu chứng đau mắt, nhìn mờ, cộm mắt hoặc đỏ mắt cần được bác sĩ chuyên khoa Mắt thăm khám sớm để tránh ảnh hưởng thị lực.";
        }
        if (hasDermatologicalSymptoms(text)) {
            return "Tình trạng nổi mẩn, ngứa, phát ban, dị ứng hoặc mụn thường thuộc chuyên khoa Da liễu. Bạn không nên tự ý bôi thuốc mà cần đi khám để bác sĩ xác định nguyên nhân.";
        }
        if (hasMusculoskeletalSymptoms(text)) {
            return "Triệu chứng đau nhức xương khớp, vai gáy, cột sống hoặc chấn thương nhẹ phù hợp để khám Cơ xương khớp. Hạn chế vận động mạnh để tránh tổn thương thêm.";
        }
        if (hasDigestiveSymptoms(text)) {
            return "Tình trạng đau bụng, trĩ, táo bón hoặc khó tiêu thường phù hợp khám chuyên khoa Tiêu hóa. Trước mắt bạn nên uống đủ nước, ăn đồ mềm và đi khám nếu triệu chứng kéo dài.";
        }
        if (hasEntSymptoms(text)) {
            return "Các triệu chứng sốt, ho, ù tai, sổ mũi hoặc đau họng thường phù hợp khám Nội khoa hoặc Tai Mũi Họng. Bạn nên uống đủ nước, theo dõi nhiệt độ và đi khám nếu không thuyên giảm.";
        }
        if (hasDentalSymptoms(text)) {
            return "Các vấn đề về răng miệng như nhức răng, chảy máu chân răng hay sưng lợi cần được can thiệp trực tiếp bởi bác sĩ Răng Hàm Mặt. Bạn nên đặt lịch khám sớm.";
        }
        if (hasGynecologySymptoms(text)) {
            return "Với các triệu chứng của bạn, khám Sản phụ khoa là phù hợp nhất để bác sĩ siêu âm và kiểm tra chuyên sâu hơn.";
        }
        if (hasUrinarySymptoms(text)) {
            return "Dấu hiệu tiểu buốt, tiểu rắt có thể là viêm đường tiết niệu. Bạn nên uống nhiều nước và đi khám Nội khoa sớm để xét nghiệm nước tiểu.";
        }
        return null;
    }

    private String mockSpecialtySuggestion(List<AiChatMessage> history) {
        String targetText = "";
        for (int i = history.size() - 1; i >= 0; i--) {
            if ("PATIENT".equalsIgnoreCase(history.get(i).getSenderType())) {
                String text = normalizeText(history.get(i).getMessageText());
                if (hasAnySymptom(text)) {
                    targetText = text;
                    break;
                }
            }
        }
        if (targetText.isEmpty() && !history.isEmpty()) {
             for (int i = history.size() - 1; i >= 0; i--) {
                 if ("PATIENT".equalsIgnoreCase(history.get(i).getSenderType())) {
                     targetText = normalizeText(history.get(i).getMessageText());
                     break;
                 }
             }
        }

        List<String> recommendations = new ArrayList<>();

        if (hasKeyword(targetText, "buồn", "chán", "thất tình", "chia tay", "chán nản", "tuyệt vọng")) {
            return "{\"recommendations\":[],\"message\":\"Vấn đề của bạn dường như liên quan đến tâm lý. Bạn có thể chia sẻ thêm hoặc liên hệ chuyên gia Tâm lý học để được hỗ trợ.\"}";
        }

        if (hasKeyword(targetText, "gãy xương", "gay xuong", "chấn thương", "chan thuong", "té ngã", "te nga")) {
            recommendations.add("{\"departmentName\":\"Ngoại khoa\",\"confidenceScore\":90.0,\"explanation\":\"Nghi ngờ có chấn thương hoặc gãy xương, cần khám Ngoại khoa để đánh giá và xử trí kịp thời.\"}");
        }
        if (hasChestOrBreathingSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Tim mạch\",\"confidenceScore\":88.0,\"explanation\":\"Triệu chứng có dấu hiệu liên quan tim mạch.\"}");
            recommendations.add("{\"departmentName\":\"Hô hấp\",\"confidenceScore\":80.0,\"explanation\":\"Triệu chứng có dấu hiệu liên quan hệ hô hấp.\"}");
        }
        if (hasPsychologicalSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Thần kinh\",\"confidenceScore\":82.0,\"explanation\":\"Triệu chứng liên quan đến giấc ngủ hoặc sức khỏe tinh thần.\"}");
        }
        if (hasNeurologicalSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Thần kinh\",\"confidenceScore\":85.0,\"explanation\":\"Triệu chứng liên quan đến hệ thần kinh, cần đi khám để đánh giá chi tiết.\"}");
        }
        if (hasEyeSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Mắt\",\"confidenceScore\":90.0,\"explanation\":\"Các triệu chứng tại mắt cần được bác sĩ nhãn khoa kiểm tra sớm.\"}");
        }
        if (hasDermatologicalSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Da liễu\",\"confidenceScore\":85.0,\"explanation\":\"Biểu hiện ngoài da cần được bác sĩ chuyên khoa da liễu chẩn đoán nguyên nhân.\"}");
        }
        if (hasMusculoskeletalSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Cơ xương khớp\",\"confidenceScore\":80.0,\"explanation\":\"Tình trạng đau nhức phù hợp để khám Cơ xương khớp.\"}");
        }
        if (hasDigestiveSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Tiêu hóa\",\"confidenceScore\":84.0,\"explanation\":\"Triệu chứng chủ yếu thuộc hệ tiêu hóa hoặc hậu môn trực tràng.\"}");
        }
        if (hasEntSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Tai Mũi Họng\",\"confidenceScore\":82.0,\"explanation\":\"Các triệu chứng tập trung ở đường hô hấp trên hoặc tai, mũi, họng.\"}");
        }
        if (hasDentalSymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Răng Hàm Mặt\",\"confidenceScore\":95.0,\"explanation\":\"Vấn đề về răng miệng cần khám chuyên khoa Răng Hàm Mặt.\"}");
        }
        if (hasGynecologySymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Sản phụ khoa\",\"confidenceScore\":90.0,\"explanation\":\"Triệu chứng thuộc chuyên khoa Sản phụ khoa.\"}");
        }
        if (hasUrinarySymptoms(targetText)) {
            recommendations.add("{\"departmentName\":\"Nội khoa\",\"confidenceScore\":88.0,\"explanation\":\"Dấu hiệu về đường tiết niệu, cần khám Nội khoa để xét nghiệm nước tiểu.\"}");
        }

        if (recommendations.isEmpty()) {
            if (targetText.length() > 5 && !targetText.contains("đau")) {
                return "{\"recommendations\":[],\"message\":\"Thông tin triệu chứng chưa đủ rõ để gợi ý chuyên khoa. Vui lòng mô tả thêm triệu chứng cụ thể.\"}";
            }
            return "{\"recommendations\":[{\"departmentName\":\"Khám tổng quát\",\"confidenceScore\":75.0,\"explanation\":\"Thông tin triệu chứng còn chung chung, khám tổng quát sẽ giúp bác sĩ định hướng bước tiếp theo.\"}],\"message\":\"\"}";
        }

        // Keep top 3
        while (recommendations.size() > 3) {
            recommendations.remove(recommendations.size() - 1);
        }

        return "{\"recommendations\":[" + String.join(",", recommendations) + "],\"message\":\"\"}";
    }

    private boolean hasAnySymptom(String text) {
        return hasChestOrBreathingSymptoms(text) || hasNeurologicalSymptoms(text) 
            || hasPsychologicalSymptoms(text) || hasEyeSymptoms(text) 
            || hasDermatologicalSymptoms(text) || hasMusculoskeletalSymptoms(text) 
            || hasDigestiveSymptoms(text) || hasEntSymptoms(text)
            || hasDentalSymptoms(text) || hasGynecologySymptoms(text) || hasUrinarySymptoms(text)
            || hasKeyword(text, "gãy xương", "gay xuong", "chấn thương", "chan thuong", "té ngã", "te nga");
    }

    private String mockStandardizeClinicalNote(String rawNote) {
        if (rawNote == null) rawNote = "";
        String safeNote = rawNote.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
        return "{\n" +
               "  \"symptoms\": \"" + safeNote + "\",\n" +
               "  \"clinicalFindings\": \"\",\n" +
               "  \"diagnosis\": \"\",\n" +
               "  \"treatmentPlan\": \"\",\n" +
               "  \"doctorNote\": \"\"\n" +
               "}";
    }

    private boolean asksForSpecialty(String text) {
        return hasKeyword(text, "chuyen khoa", "chuyên khoa", "khoa nao", "khoa nào", "nen chon", "nên chọn", "kham khoa", "khám khoa");
    }

    private boolean hasKeyword(String text, String... keywords) {
        for (String kw : keywords) {
            String regex = "(?iu)(?:^|\\W)" + java.util.regex.Pattern.quote(kw) + "(?:$|\\W)";
            if (java.util.regex.Pattern.compile(regex).matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private boolean hasChestOrBreathingSymptoms(String text) {
        return hasKeyword(text, "đau ngực", "dau nguc", "tim", "khó thở", "kho tho", "đập nhanh", "dap nhanh");
    }

    private boolean hasNeurologicalSymptoms(String text) {
        return hasKeyword(text, "đau đầu", "dau dau", "chóng mặt", "chong mat", "tê tay", "te tay", "tê chân", "te chan");
    }

    private boolean hasPsychologicalSymptoms(String text) {
        return hasKeyword(text, "mất ngủ", "mat ngu", "khó ngủ", "kho ngu", "lo âu", "lo au", "stress", "căng thẳng", "cang thang", "suy nhược", "suy nhuoc");
    }

    private boolean hasEyeSymptoms(String text) {
        return hasKeyword(text, "đau mắt", "dau mat", "nhìn mờ", "nhin mo", "đỏ mắt", "do mat", "sưng mắt", "sung mat", "cộm mắt", "com mat", "nhức mắt", "nhuc mat", "chảy nước mắt", "chay nuoc mat");
    }

    private boolean hasDermatologicalSymptoms(String text) {
        return hasKeyword(text, "nổi mẩn", "noi man", "ngứa", "ngua", "phát ban", "phat ban", "mụn", "mun", "dị ứng", "di ung", "mề đay", "me day", "ngứa toàn thân", "ngua toan than", "dị ứng hải sản", "di ung hai san");
    }

    private boolean hasMusculoskeletalSymptoms(String text) {
        return hasKeyword(text, "đau khớp", "dau khop", "đau lưng", "dau lung", "đau gối", "dau goi", "đau vai", "dau vai", "đau cổ", "dau co", "đau cột sống", "dau cot song", "thoát vị", "thoat vi", "bong gân", "bong gan", "gãy xương", "gay xuong", "chấn thương", "chan thuong", "té ngã", "te nga", "sưng khớp", "sung khop");
    }

    private boolean hasEntSymptoms(String text) {
        return hasKeyword(text, "sốt", "sot", "ho", "đau họng", "dau hong", "sổ mũi", "so mui", "tai", "mũi", "mui", "ù tai", "u tai", "đau tai", "dau tai", "chảy mủ tai", "chay mu tai", "nghẹt mũi", "nghet mui");
    }

    private boolean hasDigestiveSymptoms(String text) {
        return hasKeyword(text, "đau bụng", "dau bung", "tiêu chảy", "tieu chay", "buồn nôn", "buon non", "ỉa", "ia", "đi ngoài", "di ngoai", "phân lỏng", "phan long", "trĩ", "tri", "lòi dom", "loi dom", "táo bón", "tao bon", "cầu ra máu", "cau ra mau", "ngoài ra máu", "ngoai ra mau", "trào ngược", "trao nguoc", "ợ chua", "o chua", "đầy hơi", "day hoi");
    }

    private boolean hasDentalSymptoms(String text) {
        return hasKeyword(text, "đau răng", "dau rang", "nhức răng", "nhuc rang", "sâu răng", "sau rang", "chảy máu chân răng", "chay mau chan rang", "sưng lợi", "sung loi", "viêm lợi", "viem loi", "niềng răng", "nieng rang");
    }

    private boolean hasGynecologySymptoms(String text) {
        return hasKeyword(text, "trễ kinh", "tre kinh", "đau bụng kinh", "dau bung kinh", "khí hư", "khi hu", "ngứa vùng kín", "ngua vung kin", "khám thai", "kham thai", "mang thai");
    }

    private boolean hasUrinarySymptoms(String text) {
        return hasKeyword(text, "tiểu buốt", "tieu buot", "tiểu rắt", "tieu rat", "tiểu ra máu", "tieu ra mau", "đái ra máu", "dai ra mau", "đau buốt khi tiểu", "dau buot khi tieu", "nước tiểu đục", "nuoc tieu duc");
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}
