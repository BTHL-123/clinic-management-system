package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

final class ClinicalNoteResponseParser {

    private ClinicalNoteResponseParser() {
    }

    static StandardizeNoteResponse parse(ObjectMapper objectMapper, String rawResponse) throws Exception {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw emptyResponse();
        }

        int objectStart = rawResponse.indexOf('{');
        int objectEnd = rawResponse.lastIndexOf('}');
        if (objectStart < 0 || objectEnd < objectStart) {
            throw new BusinessException("AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
        }

        JsonNode root = objectMapper.readTree(rawResponse.substring(objectStart, objectEnd + 1));
        if (root.path("data").isObject() && !hasClinicalFields(root)) {
            root = root.path("data");
        }

        StandardizeNoteResponse response = new StandardizeNoteResponse(
                readField(root, "symptoms", "symptom"),
                readField(root, "clinicalFindings", "clinical_findings", "findings"),
                readDiagnosis(root),
                readField(root, "treatmentPlan", "treatment_plan", "plan"),
                readField(root, "doctorNote", "doctor_note", "notes")
        );

        if (List.of(
                response.getSymptoms(),
                response.getClinicalFindings(),
                response.getDiagnosis(),
                response.getTreatmentPlan(),
                response.getDoctorNote()
        ).stream().noneMatch(value -> value != null && !value.isBlank())) {
            throw emptyResponse();
        }
        return response;
    }

    private static boolean hasClinicalFields(JsonNode root) {
        return root.has("symptoms") || root.has("clinicalFindings") || root.has("clinical_findings")
                || root.has("diagnosis") || root.has("treatmentPlan") || root.has("treatment_plan")
                || root.has("doctorNote") || root.has("doctor_note");
    }

    private static String readDiagnosis(JsonNode root) {
        JsonNode diagnosis = firstPresent(root, "diagnosis", "diagnoses");
        if (diagnosis == null || diagnosis.isNull()) {
            return "";
        }
        if (!diagnosis.isObject()) {
            return nodeToText(diagnosis);
        }

        String code = readField(diagnosis, "code", "icd10", "icdCode", "icd_code");
        String name = readField(diagnosis, "name", "diagnosis", "description", "text");
        if (!code.isBlank() && !name.isBlank()) {
            return "[" + code + "] " + name;
        }
        return !name.isBlank() ? name : code;
    }

    private static String readField(JsonNode root, String... fieldNames) {
        JsonNode value = firstPresent(root, fieldNames);
        return value == null ? "" : nodeToText(value);
    }

    private static JsonNode firstPresent(JsonNode root, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode value = root.get(fieldName);
            if (value != null && !value.isNull()) {
                return value;
            }
        }
        return null;
    }

    private static String nodeToText(JsonNode node) {
        if (node == null || node.isNull()) {
            return "";
        }
        if (node.isValueNode()) {
            return node.asText("").trim();
        }
        if (node.isArray()) {
            List<String> values = new ArrayList<>();
            node.forEach(item -> {
                String value = nodeToText(item);
                if (!value.isBlank()) {
                    values.add(value);
                }
            });
            return String.join("; ", values);
        }
        if (node.isObject()) {
            for (String preferredKey : List.of("text", "value", "name", "description")) {
                String preferred = readField(node, preferredKey);
                if (!preferred.isBlank()) {
                    return preferred;
                }
            }
            List<String> values = new ArrayList<>();
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                String value = nodeToText(fields.next().getValue());
                if (!value.isBlank()) {
                    values.add(value);
                }
            }
            return String.join("; ", values);
        }
        return "";
    }

    private static BusinessException emptyResponse() {
        return new BusinessException(
                "AI chưa trích xuất được thông tin nào. Vui lòng bổ sung ghi chú rõ hơn."
        );
    }
}
