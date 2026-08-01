package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.text.Normalizer;
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

        JsonNode parsedRoot = objectMapper.readTree(rawResponse.substring(objectStart, objectEnd + 1));
        JsonNode root = findClinicalRoot(parsedRoot, 0);
        if (root == null) {
            root = parsedRoot;
        }

        StandardizeNoteResponse response = new StandardizeNoteResponse(
                readField(root, "symptoms", "symptom", "trieuChung", "triệu chứng"),
                readField(root, "clinicalFindings", "clinical_findings", "findings", "khamLamSang", "khám lâm sàng"),
                readDiagnosis(root),
                readField(root, "treatmentPlan", "treatment_plan", "plan", "keHoachDieuTri", "kế hoạch điều trị", "phacDo", "phác đồ"),
                readField(root, "doctorNote", "doctor_note", "notes", "ghiChuBacSi", "ghi chú bác sĩ", "loiDan", "lời dặn")
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
        return firstPresent(root, "symptoms", "symptom", "trieuChung", "triệu chứng") != null
                || firstPresent(root, "clinicalFindings", "clinical_findings", "findings", "khamLamSang", "khám lâm sàng") != null
                || firstPresent(root, "diagnosis", "diagnoses", "chanDoan", "chẩn đoán") != null
                || firstPresent(root, "treatmentPlan", "treatment_plan", "plan", "keHoachDieuTri", "kế hoạch điều trị", "phacDo", "phác đồ") != null
                || firstPresent(root, "doctorNote", "doctor_note", "notes", "ghiChuBacSi", "ghi chú bác sĩ", "loiDan", "lời dặn") != null;
    }

    private static JsonNode findClinicalRoot(JsonNode node, int depth) {
        if (node == null || depth > 4) {
            return null;
        }
        if (node.isObject() && hasClinicalFields(node)) {
            return node;
        }
        if (node.isContainerNode()) {
            for (JsonNode child : node) {
                JsonNode match = findClinicalRoot(child, depth + 1);
                if (match != null) {
                    return match;
                }
            }
        }
        return null;
    }

    private static String readDiagnosis(JsonNode root) {
        JsonNode diagnosis = firstPresent(root, "diagnosis", "diagnoses", "chanDoan", "chẩn đoán");
        if (diagnosis == null || diagnosis.isNull()) {
            return "";
        }
        if (!diagnosis.isObject()) {
            return nodeToText(diagnosis);
        }

        String code = readField(diagnosis, "code", "icd10", "icdCode", "icd_code", "maIcd", "mã ICD");
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
        if (root.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String actualName = normalizeFieldName(field.getKey());
                for (String expectedName : fieldNames) {
                    if (actualName.equals(normalizeFieldName(expectedName)) && !field.getValue().isNull()) {
                        return field.getValue();
                    }
                }
            }
        }
        return null;
    }

    private static String normalizeFieldName(String value) {
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
        return withoutMarks.replaceAll("[^A-Za-z0-9]", "").toLowerCase();
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
