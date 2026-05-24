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

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    public String chat(List<AiChatMessage> history, String newMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return mockChatReply(newMessage);
        }

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
        if (apiKey == null || apiKey.isBlank()) {
            return mockSpecialtySuggestion(history);
        }

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

    private String mockChatReply(String newMessage) {
        String normalized = newMessage == null ? "" : newMessage.toLowerCase();
        if (normalized.contains("đau ngực") || normalized.contains("tim") || normalized.contains("khó thở")) {
            return "Bạn đang mô tả triệu chứng có thể liên quan tim mạch hoặc hô hấp. Nếu đau ngực dữ dội, khó thở nhiều, vã mồ hôi hoặc choáng, bạn nên đi cấp cứu ngay. Nếu triệu chứng nhẹ hơn, tôi gợi ý bạn đặt lịch khám Tim mạch để được kiểm tra.";
        }
        if (normalized.contains("sốt") || normalized.contains("ho") || normalized.contains("đau họng")) {
            return "Các triệu chứng sốt, ho hoặc đau họng thường cần được bác sĩ thăm khám để phân biệt nhiễm siêu vi, hô hấp hoặc tai mũi họng. Bạn nên uống đủ nước, theo dõi nhiệt độ và đặt lịch khám Nội khoa hoặc Tai Mũi Họng nếu kéo dài.";
        }
        if (normalized.contains("đau bụng") || normalized.contains("tiêu chảy") || normalized.contains("buồn nôn")) {
            return "Triệu chứng tiêu hóa như đau bụng, tiêu chảy hoặc buồn nôn nên được đánh giá thêm về vị trí đau, thời gian kéo dài và dấu hiệu mất nước. Tôi gợi ý bạn khám Tiêu hóa để được tư vấn phù hợp.";
        }
        return "Tôi đã ghi nhận triệu chứng của bạn. Bạn có thể nói rõ hơn triệu chứng bắt đầu từ khi nào, mức độ nặng nhẹ, có sốt/đau/khó thở không và bạn đã dùng thuốc gì chưa? Tôi sẽ dựa vào đó để gợi ý chuyên khoa phù hợp.";
    }

    private String mockSpecialtySuggestion(List<AiChatMessage> history) {
        String combinedText = history.stream()
                .filter(message -> "PATIENT".equalsIgnoreCase(message.getSenderType()))
                .map(AiChatMessage::getMessageText)
                .reduce("", (left, right) -> left + " " + right)
                .toLowerCase();

        if (combinedText.contains("đau ngực") || combinedText.contains("tim")) {
            return "{\"departmentName\":\"Tim mạch\",\"confidenceScore\":88,\"explanation\":\"Triệu chứng có dấu hiệu liên quan tim mạch nên cần kiểm tra chuyên khoa để loại trừ nguy cơ.\"}";
        }
        if (combinedText.contains("đau họng") || combinedText.contains("tai") || combinedText.contains("mũi") || combinedText.contains("ho")) {
            return "{\"departmentName\":\"Tai Mũi Họng\",\"confidenceScore\":82,\"explanation\":\"Các triệu chứng tập trung ở đường hô hấp trên, phù hợp để khám Tai Mũi Họng.\"}";
        }
        if (combinedText.contains("đau bụng") || combinedText.contains("tiêu chảy") || combinedText.contains("buồn nôn")) {
            return "{\"departmentName\":\"Tiêu hóa\",\"confidenceScore\":84,\"explanation\":\"Triệu chứng chủ yếu thuộc hệ tiêu hóa, nên khám chuyên khoa Tiêu hóa để đánh giá thêm.\"}";
        }
        return "{\"departmentName\":\"Khám tổng quát\",\"confidenceScore\":75,\"explanation\":\"Thông tin triệu chứng còn chung chung, khám tổng quát sẽ giúp bác sĩ định hướng bước tiếp theo.\"}";
    }
}
