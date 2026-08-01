package com.clinicmanagement.aichat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ClinicalNoteResponseParserTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parsesMarkdownWrappedCamelCaseResponse() throws Exception {
        StandardizeNoteResponse response = ClinicalNoteResponseParser.parse(objectMapper, """
                ```json
                {
                  "symptoms": "Ho và sốt 3 ngày",
                  "clinicalFindings": "Phổi có ran ẩm",
                  "diagnosis": "[J18.9] Viêm phổi",
                  "treatmentPlan": "Chụp X-quang phổi",
                  "doctorNote": "Uống đủ nước"
                }
                ```
                """);

        assertEquals("Ho và sốt 3 ngày", response.getSymptoms());
        assertEquals("Phổi có ran ẩm", response.getClinicalFindings());
        assertEquals("[J18.9] Viêm phổi", response.getDiagnosis());
        assertEquals("Chụp X-quang phổi", response.getTreatmentPlan());
        assertEquals("Uống đủ nước", response.getDoctorNote());
    }

    @Test
    void parsesArraysSnakeCaseAndStructuredDiagnosis() throws Exception {
        StandardizeNoteResponse response = ClinicalNoteResponseParser.parse(objectMapper, """
                {
                  "data": {
                    "symptoms": ["Ho", "Sốt 39 độ"],
                    "clinical_findings": ["Họng đỏ", "Phổi ran"],
                    "diagnosis": {"icd10": "J18.9", "name": "Viêm phổi"},
                    "treatment_plan": ["X-quang", "Công thức máu"],
                    "doctor_note": "Theo dõi khó thở"
                  }
                }
                """);

        assertEquals("Ho; Sốt 39 độ", response.getSymptoms());
        assertEquals("Họng đỏ; Phổi ran", response.getClinicalFindings());
        assertEquals("[J18.9] Viêm phổi", response.getDiagnosis());
        assertEquals("X-quang; Công thức máu", response.getTreatmentPlan());
        assertEquals("Theo dõi khó thở", response.getDoctorNote());
    }

    @Test
    void rejectsResponseWithoutExtractedClinicalData() {
        assertThrows(
                BusinessException.class,
                () -> ClinicalNoteResponseParser.parse(objectMapper, "{\"symptoms\":\"\"}")
        );
    }
}
