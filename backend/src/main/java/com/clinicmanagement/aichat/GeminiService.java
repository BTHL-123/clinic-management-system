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

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    public String chat(List<AiChatMessage> history, String newMessage) {
        try {
            String url = String.format(GEMINI_API_URL, model, apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            
            // Build system instruction
            Map<String, Object> systemInstruction = new HashMap<>();
            Map<String, Object> systemParts = new HashMap<>();
            systemParts.put("text", "Bạn là một trợ lý y tế ảo của phòng khám. Nhiệm vụ của bạn là hỏi thăm, tư vấn nhẹ nhàng các triệu chứng của bệnh nhân và định hướng họ đi khám chuyên khoa. Tuyệt đối không được kê đơn thuốc.");
            systemInstruction.put("parts", List.of(systemParts));
            requestBody.put("system_instruction", systemInstruction);

            // Build contents
            List<Map<String, Object>> contents = new ArrayList<>();
            for (AiChatMessage msg : history) {
                Map<String, Object> part = new HashMap<>();
                part.put("text", msg.getMessageText());
                Map<String, Object> content = new HashMap<>();
                content.put("role", "PATIENT".equalsIgnoreCase(msg.getSenderType()) ? "user" : "model");
                content.put("parts", List.of(part));
                contents.add(content);
            }

            // Add new message
            Map<String, Object> newPart = new HashMap<>();
            newPart.put("text", newMessage);
            Map<String, Object> newContent = new HashMap<>();
            newContent.put("role", "user");
            newContent.put("parts", List.of(newPart));
            contents.add(newContent);

            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("candidates") && root.get("candidates").isArray() && root.get("candidates").size() > 0) {
                JsonNode candidate = root.get("candidates").get(0);
                if (candidate.has("content") && candidate.get("content").has("parts")) {
                    JsonNode parts = candidate.get("content").get("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).get("text").asText();
                    }
                }
            }
            return "Xin lỗi, tôi không thể trả lời lúc này do lỗi kết nối đến AI.";
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Error calling Gemini API. Status: {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "Bạn chờ tôi một chút nhé, hệ thống hiện đang xử lý hơi quá tải. Bạn vui lòng gửi lại tin nhắn sau vài giây nhé!";
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return "Xin lỗi bạn, tôi đang gặp một chút sự cố kết nối. Bạn vui lòng thử lại sau giây lát nhé!";
        }
    }

    public String analyzeSymptoms(List<AiChatMessage> history) {
        try {
            String url = String.format(GEMINI_API_URL, model, apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            
            // System instruction for JSON
            Map<String, Object> systemInstruction = new HashMap<>();
            Map<String, Object> systemParts = new HashMap<>();
            systemParts.put("text", "Bạn là một hệ thống phân tích bệnh án. Đọc lịch sử trò chuyện và trả về ĐÚNG MỘT JSON OBJECT chứa 3 trường: 'departmentName' (chọn từ: Nội khoa, Ngoại khoa, Nhi khoa, Sản phụ khoa, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Mắt, Thần kinh, Tim mạch, Tiêu hóa, Cơ xương khớp, Khám tổng quát), 'confidenceScore' (số thực 0-100), 'explanation' (giải thích ngắn 1-2 câu). Chỉ trả về JSON hợp lệ, không chứa markdown (như ```json), không chứa text nào khác.");
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
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("candidates") && root.get("candidates").isArray() && root.get("candidates").size() > 0) {
                JsonNode candidate = root.get("candidates").get(0);
                if (candidate.has("content") && candidate.get("content").has("parts")) {
                    JsonNode parts = candidate.get("content").get("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).get("text").asText().trim();
                    }
                }
            }
            return "{}";
        } catch (Exception e) {
            log.error("Error calling Gemini API for analysis", e);
            return "{}";
        }
    }
}
