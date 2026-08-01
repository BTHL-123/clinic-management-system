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

    @Test
    void parsesVietnameseKeysInsideCustomEnvelope() throws Exception {
        StandardizeNoteResponse response = ClinicalNoteResponseParser.parse(objectMapper, """
                {
                  "ket_qua_chuan_hoa": {
                    "Triệu chứng": "Đau thượng vị",
                    "Khám lâm sàng": "Ấn đau vùng thượng vị",
                    "Chẩn đoán": {"ma_icd": "K21.9", "name": "Trào ngược dạ dày thực quản"},
                    "Kế hoạch điều trị": ["Nội soi dạ dày", "Test vi khuẩn HP"],
                    "Lời dặn": "Tái khám sau 2 tuần"
                  }
                }
                """);

        assertEquals("Đau thượng vị", response.getSymptoms());
        assertEquals("Ấn đau vùng thượng vị", response.getClinicalFindings());
        assertEquals("[K21.9] Trào ngược dạ dày thực quản", response.getDiagnosis());
        assertEquals("Nội soi dạ dày; Test vi khuẩn HP", response.getTreatmentPlan());
        assertEquals("Tái khám sau 2 tuần", response.getDoctorNote());
    }

    @Test
    void combinesSeparateTopLevelIcdCodeAndConfirmedDiagnosis() throws Exception {
        StandardizeNoteResponse response = ClinicalNoteResponseParser.parse(objectMapper, """
                {
                  "symptoms": "Ợ chua, đau thượng vị",
                  "icd10": "K21.9",
                  "diagnosis": "Trào ngược dạ dày thực quản",
                  "treatmentPlan": "Điều trị giảm tiết acid",
                  "doctorNote": "Theo dõi đáp ứng điều trị và tái khám sau 2 tuần"
                }
                """);

        assertEquals("[K21.9] Trào ngược dạ dày thực quản", response.getDiagnosis());
        assertEquals("Theo dõi đáp ứng điều trị và tái khám sau 2 tuần", response.getDoctorNote());
    }
}
