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
            return mockChatReply(history, newMessage);
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

    public String standardizeClinicalNote(String rawNote) {
        if (apiKey == null || apiKey.isBlank()) {
            return mockStandardizeClinicalNote(rawNote);
        }

        try {
            String url = String.format(GEMINI_API_URL, model, apiKey);

            Map<String, Object> requestBody = new HashMap<>();

            // System instruction for JSON
            Map<String, Object> systemInstruction = new HashMap<>();
            Map<String, Object> systemParts = new HashMap<>();
            systemParts.put("text", "Bạn là một bác sĩ hỗ trợ chuẩn hóa bệnh án. Đọc ghi chú thô của bác sĩ và điền vào 5 trường: 'symptoms' (triệu chứng), 'clinicalFindings' (khám lâm sàng), 'diagnosis' (chẩn đoán), 'treatmentPlan' (kế hoạch điều trị), 'doctorNote' (lời dặn). Trả về ĐÚNG MỘT JSON OBJECT với 5 trường này. Nếu thông tin nào không có, hãy để trống chuỗi (\"\"). Chỉ trả về JSON thuần hợp lệ, không bọc bằng ```json hay markdown, không chứa text nào khác.");
            systemInstruction.put("parts", List.of(systemParts));
            requestBody.put("system_instruction", systemInstruction);

            // Build contents
            Map<String, Object> part = new HashMap<>();
            part.put("text", "Ghi chú thô:\n" + rawNote + "\nPhân tích và trả về JSON.");
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
            log.error("Error calling Gemini API for standardizing clinical notes", e);
            return "{}";
        }
    }

    private String mockChatReply(List<AiChatMessage> history, String newMessage) {
        String currentMessage = normalizeText(newMessage);
        String allPatientMessages = normalizeText(history.stream()
                .filter(message -> "PATIENT".equalsIgnoreCase(message.getSenderType()))
                .map(AiChatMessage::getMessageText)
                .reduce("", (left, right) -> left + " " + right + " ")
                + " " + newMessage);

        if (asksForSpecialty(currentMessage)) {
            if (hasDigestiveSymptoms(allPatientMessages)) {
                return "Với thông tin bạn bị tiêu chảy/đi ngoài liên tục khoảng 2 ngày, không sốt và chưa dùng thuốc, chuyên khoa phù hợp nhất là Tiêu hóa. Bạn nên đi khám sớm nếu đi ngoài nhiều lần trong ngày, mất nước, đau bụng tăng, phân có máu hoặc triệu chứng không giảm.";
            }
            if (hasChestOrBreathingSymptoms(allPatientMessages)) {
                return "Với triệu chứng đau ngực, tim hoặc khó thở, bạn nên ưu tiên khám Tim mạch. Nếu đau ngực dữ dội, khó thở nhiều, choáng hoặc vã mồ hôi thì nên đi cấp cứu ngay.";
            }
            if (hasEntSymptoms(allPatientMessages)) {
                return "Với ho, đau họng hoặc triệu chứng vùng tai mũi họng, bạn nên chọn Tai Mũi Họng. Nếu kèm sốt cao hoặc khó thở thì nên đi khám sớm hơn.";
            }
            return "Hiện thông tin triệu chứng còn ít nên tôi chưa thể chọn chuyên khoa thật chắc. Nếu phải chọn ngay, bạn nên chọn Khám tổng quát để bác sĩ sàng lọc ban đầu.";
        }

        if (hasChestOrBreathingSymptoms(allPatientMessages)) {
            return "Bạn đang mô tả triệu chứng có thể liên quan tim mạch hoặc hô hấp. Nếu đau ngực dữ dội, khó thở nhiều, vã mồ hôi hoặc choáng, bạn nên đi cấp cứu ngay. Nếu triệu chứng nhẹ hơn, tôi gợi ý bạn đặt lịch khám Tim mạch để được kiểm tra.";
        }
        if (hasDigestiveSymptoms(allPatientMessages)) {
            return "Tình trạng tiêu chảy/đi ngoài liên tục trong 2 ngày thường phù hợp để khám chuyên khoa Tiêu hóa. Trước mắt bạn nên uống đủ nước, có thể dùng dung dịch bù điện giải nếu đi ngoài nhiều. Nếu có sốt, đau bụng nhiều, khát nhiều, mệt lả, phân có máu hoặc không giảm sau 24-48 giờ thì nên đi khám sớm.";
        }
        if (hasEntSymptoms(allPatientMessages)) {
            return "Các triệu chứng sốt, ho hoặc đau họng thường cần được bác sĩ thăm khám để phân biệt nhiễm siêu vi, hô hấp hoặc tai mũi họng. Bạn nên uống đủ nước, theo dõi nhiệt độ và đặt lịch khám Nội khoa hoặc Tai Mũi Họng nếu kéo dài.";
        }
        return "Tôi đã ghi nhận triệu chứng của bạn. Bạn có thể nói rõ hơn triệu chứng bắt đầu từ khi nào, mức độ nặng nhẹ, có sốt/đau/khó thở không và bạn đã dùng thuốc gì chưa? Tôi sẽ dựa vào đó để gợi ý chuyên khoa phù hợp.";
    }

    private String mockSpecialtySuggestion(List<AiChatMessage> history) {
        String combinedText = history.stream()
                .filter(message -> "PATIENT".equalsIgnoreCase(message.getSenderType()))
                .map(AiChatMessage::getMessageText)
                .reduce("", (left, right) -> left + " " + right)
                .toLowerCase();

        if (hasChestOrBreathingSymptoms(combinedText)) {
            return "{\"departmentName\":\"Tim mạch\",\"confidenceScore\":88,\"explanation\":\"Triệu chứng có dấu hiệu liên quan tim mạch nên cần kiểm tra chuyên khoa để loại trừ nguy cơ.\"}";
        }
        if (hasEntSymptoms(combinedText)) {
            return "{\"departmentName\":\"Tai Mũi Họng\",\"confidenceScore\":82,\"explanation\":\"Các triệu chứng tập trung ở đường hô hấp trên, phù hợp để khám Tai Mũi Họng.\"}";
        }
        if (hasDigestiveSymptoms(combinedText)) {
            return "{\"departmentName\":\"Tiêu hóa\",\"confidenceScore\":84,\"explanation\":\"Triệu chứng chủ yếu thuộc hệ tiêu hóa, nên khám chuyên khoa Tiêu hóa để đánh giá thêm.\"}";
        }
        return "{\"departmentName\":\"Khám tổng quát\",\"confidenceScore\":75,\"explanation\":\"Thông tin triệu chứng còn chung chung, khám tổng quát sẽ giúp bác sĩ định hướng bước tiếp theo.\"}";
    }

    private String mockStandardizeClinicalNote(String rawNote) {
        return "{\n" +
               "  \"symptoms\": \"Bệnh nhân khai ho khan, sốt nhẹ.\",\n" +
               "  \"clinicalFindings\": \"Họng đỏ, không có hạt. Phổi trong, không rales.\",\n" +
               "  \"diagnosis\": \"Viêm họng cấp\",\n" +
               "  \"treatmentPlan\": \"Dùng thuốc hạ sốt, kháng viêm đường họng.\",\n" +
               "  \"doctorNote\": \"Uống nhiều nước ấm, súc họng bằng nước muối sinh lý.\"\n" +
               "}";
    }

    private boolean asksForSpecialty(String text) {
        return text.contains("chuyen khoa")
                || text.contains("chuyên khoa")
                || text.contains("khoa nao")
                || text.contains("khoa nào")
                || text.contains("nen chon")
                || text.contains("nên chọn")
                || text.contains("kham khoa")
                || text.contains("khám khoa");
    }

    private boolean hasChestOrBreathingSymptoms(String text) {
        return text.contains("đau ngực")
                || text.contains("dau nguc")
                || text.contains("tim")
                || text.contains("khó thở")
                || text.contains("kho tho");
    }

    private boolean hasEntSymptoms(String text) {
        return text.contains("sốt")
                || text.contains("sot")
                || text.contains("ho")
                || text.contains("đau họng")
                || text.contains("dau hong")
                || text.contains("tai")
                || text.contains("mũi")
                || text.contains("mui");
    }

    private boolean hasDigestiveSymptoms(String text) {
        return text.contains("đau bụng")
                || text.contains("dau bung")
                || text.contains("tiêu chảy")
                || text.contains("tieu chay")
                || text.contains("buồn nôn")
                || text.contains("buon non")
                || text.contains("ỉa")
                || text.contains("ia ")
                || text.contains("đi ngoài")
                || text.contains("di ngoai")
                || text.contains("phân lỏng")
                || text.contains("phan long");
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}
