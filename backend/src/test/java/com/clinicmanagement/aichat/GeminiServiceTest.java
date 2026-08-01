package com.clinicmanagement.aichat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class GeminiServiceTest {

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void retriesSuccessfulGroqResponseUntilClinicalDataIsUsable() throws Exception {
        GeminiService service = new GeminiService(objectMapper);
        ReflectionTestUtils.setField(service, "aiProvider", "groq");
        ReflectionTestUtils.setField(service, "groqApiKey", "test-key");
        ReflectionTestUtils.setField(service, "groqPrimaryModel", "primary-test-model");
        ReflectionTestUtils.setField(service, "groqFallbackModel", "fallback-test-model");

        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(once(), requestTo(GROQ_API_URL))
                .andRespond(withSuccess(groqResponse("{\"symptoms\":\"\"}"), MediaType.APPLICATION_JSON));
        server.expect(once(), requestTo(GROQ_API_URL))
                .andRespond(withSuccess(groqResponse("""
                        {
                          "symptoms": "Đau khớp gối phải khi đi lại 2 tháng",
                          "clinicalFindings": "Hạn chế gấp duỗi nhẹ, có tiếng lạo xạo",
                          "diagnosis": "[M17.11] Thoái hóa khớp gối phải",
                          "treatmentPlan": "Tập phục hồi chức năng",
                          "doctorNote": "Giảm cân, hạn chế ngồi xổm"
                        }
                        """), MediaType.APPLICATION_JSON));

        String result = service.standardizeClinicalNote("BN đau khớp gối phải khi đi lại 2 tháng");
        StandardizeNoteResponse parsed = ClinicalNoteResponseParser.parse(objectMapper, result);

        assertEquals("[M17.11] Thoái hóa khớp gối phải", parsed.getDiagnosis());
        server.verify();
    }

    private String groqResponse(String content) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "choices", List.of(Map.of("message", Map.of("content", content)))
        ));
    }
}
