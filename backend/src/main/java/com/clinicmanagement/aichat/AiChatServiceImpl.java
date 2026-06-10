package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.AiSpecialtySuggestionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.aichat.dto.SendChatMessageResponse;
import com.clinicmanagement.aichat.dto.StandardizeNoteRequest;
import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final AiChatSessionRepository sessionRepository;
    private final AiChatMessageRepository messageRepository;
    private final AiSpecialtySuggestionRepository suggestionRepository;
    private final PatientRepository patientRepository;
    private final DepartmentRepository departmentRepository;
    private final GeminiService geminiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    @Override
    public List<AiChatSessionResponse> getAllSessions(User currentUser) {
        Patient patient = patientRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new BusinessException("Chỉ bệnh nhân mới có thể xem phiên tư vấn AI."));

        return sessionRepository.findByPatientPatientIdOrderByCreatedAtDesc(patient.getPatientId())
                .stream()
                .map(s -> new AiChatSessionResponse(s.getAiChatSessionId(), s.getSessionType(), patient.getPatientId()))
                .toList();
    }

    @Transactional
    @Override
    public AiChatSessionResponse createSession(CreateAiChatSessionRequest request, User currentUser) {
        Patient patient = patientRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new BusinessException("Chỉ bệnh nhân mới có thể tạo phiên tư vấn AI."));

        AiChatSession session = new AiChatSession();
        session.setPatient(patient);
        session.setSessionType(request.sessionType());

        AiChatSession saved = sessionRepository.save(session);

        Long patientId = (patient != null) ? patient.getPatientId() : null;
        return new AiChatSessionResponse(saved.getAiChatSessionId(), saved.getSessionType(), patientId);
    }

    @Transactional
    @Override
    public SendChatMessageResponse sendMessage(Long sessionId, AiChatMessageRequest request, User currentUser) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        validateSessionOwner(session, currentUser);

        // 1. Save patient message
        AiChatMessage patientMsg = new AiChatMessage();
        patientMsg.setSession(session);
        patientMsg.setSenderType("PATIENT");
        patientMsg.setMessageText(request.messageText());
        AiChatMessage savedPatientMsg = messageRepository.save(patientMsg);

        // 2. Call Gemini API for AI Response
        String aiReplyText = geminiService.chat(session.getMessages(), request.messageText());

        // 3. Save AI message
        AiChatMessage aiMsg = new AiChatMessage();
        aiMsg.setSession(session);
        aiMsg.setSenderType("AI");
        aiMsg.setMessageText(aiReplyText);
        AiChatMessage savedAiMsg = messageRepository.save(aiMsg);

        // 4. Build response
        return new SendChatMessageResponse(
                new SendChatMessageResponse.MessageDetail(savedPatientMsg.getAiChatMessageId(), savedPatientMsg.getMessageText(), savedPatientMsg.getSenderType(), savedPatientMsg.getCreatedAt()),
                new SendChatMessageResponse.MessageDetail(savedAiMsg.getAiChatMessageId(), savedAiMsg.getMessageText(), savedAiMsg.getSenderType(), savedAiMsg.getCreatedAt())
        );
    }

    @Transactional(readOnly = true)
    @Override
    public List<SendChatMessageResponse.MessageDetail> getMessages(Long sessionId, User currentUser) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        validateSessionOwner(session, currentUser);

        return session.getMessages().stream()
                .map(msg -> new SendChatMessageResponse.MessageDetail(msg.getAiChatMessageId(), msg.getMessageText(), msg.getSenderType(), msg.getCreatedAt()))
                .toList();
    }

    @Transactional
    @Override
    public AiSpecialtySuggestionResponse generateSuggestion(Long sessionId, User currentUser) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        validateSessionOwner(session, currentUser);

        List<Department> departments = departmentRepository.findAll();
        if (departments.isEmpty()) {
            throw new BusinessException("Hệ thống chưa cấu hình danh mục chuyên khoa.");
        }

        // Call Gemini to get JSON
        String jsonResult = geminiService.analyzeSymptoms(session.getMessages());
        
        String departmentName = "Khám tổng quát";
        java.math.BigDecimal score = java.math.BigDecimal.valueOf(75.0);
        String explanation = "Hệ thống chưa đủ thông tin để định hướng. Vui lòng cung cấp thêm triệu chứng.";
        String message = "";
        List<AiSpecialtySuggestionResponse.Recommendation> recommendations = new java.util.ArrayList<>();

        try {
            // Strip markdown backticks if any (e.g. ```json ... ```)
            if (jsonResult.startsWith("```json")) {
                jsonResult = jsonResult.substring(7);
            }
            if (jsonResult.startsWith("```")) {
                jsonResult = jsonResult.substring(3);
            }
            if (jsonResult.endsWith("```")) {
                jsonResult = jsonResult.substring(0, jsonResult.length() - 3);
            }

            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(jsonResult.trim());
            if (root.has("message")) {
                message = root.get("message").asText();
            }
            
            if (root.has("recommendations") && root.get("recommendations").isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode recNode : root.get("recommendations")) {
                    String dName = recNode.has("departmentName") ? recNode.get("departmentName").asText() : "";
                    Double confScore = recNode.has("confidenceScore") ? recNode.get("confidenceScore").asDouble() : 0.0;
                    String expl = recNode.has("explanation") ? recNode.get("explanation").asText() : "";
                    if (!dName.isEmpty()) {
                        recommendations.add(new AiSpecialtySuggestionResponse.Recommendation(dName, confScore, expl));
                    }
                }
            } else if (root.has("departmentName")) {
                // Fallback for old single-object response
                String dName = root.get("departmentName").asText();
                Double confScore = root.has("confidenceScore") ? root.get("confidenceScore").asDouble() : 80.0;
                String expl = root.has("explanation") ? root.get("explanation").asText() : "";
                recommendations.add(new AiSpecialtySuggestionResponse.Recommendation(dName, confScore, expl));
            }
        } catch (Exception e) {
            // Fallback if parsing fails
        }

        if (!recommendations.isEmpty()) {
            AiSpecialtySuggestionResponse.Recommendation topRec = recommendations.get(0);
            departmentName = topRec.departmentName();
            score = java.math.BigDecimal.valueOf(topRec.confidenceScore());
            explanation = topRec.explanation();
        } else {
            if (message.isEmpty()) message = explanation;
        }

        Department matchedDept = findMatchingDepartment(departments, departmentName);
        if (matchedDept == null) {
            matchedDept = departments.get(0);
        }
        
        if (!normalizeDepartmentName(matchedDept.getDepartmentName()).equals(normalizeDepartmentName(departmentName))) {
            explanation = "AI gợi ý " + departmentName + " nhưng chuyên khoa này chưa có trong danh mục hiện tại. "
                    + "Tạm thời hệ thống đề xuất " + matchedDept.getDepartmentName()
                    + " để bác sĩ tiếp tục sàng lọc. " + explanation;
        }

        AiSpecialtySuggestion suggestion = new AiSpecialtySuggestion();
        suggestion.setSession(session);
        suggestion.setPatient(session.getPatient());
        suggestion.setDepartment(matchedDept);
        suggestion.setSymptomsText(session.getMessages().stream()
                .filter(msg -> "PATIENT".equalsIgnoreCase(msg.getSenderType()))
                .map(AiChatMessage::getMessageText)
                .reduce((left, right) -> left + "\n" + right)
                .orElse(""));
        suggestion.setConfidenceScore(score);
        suggestion.setExplanation(explanation);

        suggestion = suggestionRepository.save(suggestion);
        
        return new AiSpecialtySuggestionResponse(
            suggestion.getSuggestionId(),
            suggestion.getDepartment().getDepartmentId(),
            suggestion.getDepartment().getDepartmentName(),
            suggestion.getConfidenceScore().doubleValue(),
            suggestion.getExplanation(),
            message,
            recommendations
        );
    }

    @Transactional
    @Override
    public AiSpecialtySuggestionResponse acceptSuggestion(Long suggestionId, User currentUser) {
        AiSpecialtySuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả gợi ý chuyên khoa"));

        validateSessionOwner(suggestion.getSession(), currentUser);

        suggestion.setAcceptedByPatient(true);
        suggestionRepository.save(suggestion);

        return new AiSpecialtySuggestionResponse(
                suggestion.getSuggestionId(),
                suggestion.getDepartment().getDepartmentId(),
                suggestion.getDepartment().getDepartmentName(),
                suggestion.getConfidenceScore().doubleValue(),
                suggestion.getExplanation(),
                "",
                new java.util.ArrayList<>()
        );
    }

    @Override
    public StandardizeNoteResponse standardizeClinicalNote(StandardizeNoteRequest request, User currentUser) {
        if (request.rawNote() == null || request.rawNote().trim().isEmpty()) {
            throw new BusinessException("Ghi chú thô không được để trống");
        }

        String jsonResult = geminiService.standardizeClinicalNote(request.rawNote());

        try {
            if (jsonResult.startsWith("```json")) {
                jsonResult = jsonResult.substring(7);
            }
            if (jsonResult.startsWith("```")) {
                jsonResult = jsonResult.substring(3);
            }
            if (jsonResult.endsWith("```")) {
                jsonResult = jsonResult.substring(0, jsonResult.length() - 3);
            }

            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(jsonResult.trim());
            StandardizeNoteResponse response = new StandardizeNoteResponse();
            response.setSymptoms(root.has("symptoms") ? root.get("symptoms").asText() : "");
            response.setClinicalFindings(root.has("clinicalFindings") ? root.get("clinicalFindings").asText() : "");
            response.setDiagnosis(root.has("diagnosis") ? root.get("diagnosis").asText() : "");
            response.setTreatmentPlan(root.has("treatmentPlan") ? root.get("treatmentPlan").asText() : "");
            response.setDoctorNote(root.has("doctorNote") ? root.get("doctorNote").asText() : "");
            return response;
        } catch (Exception e) {
            throw new BusinessException("AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
        }
    }

    private void validateSessionOwner(AiChatSession session, User currentUser) {
        if (session.getPatient() == null
                || session.getPatient().getUser() == null
                || !session.getPatient().getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập phiên tư vấn AI này.");
        }
    }

    private Department findMatchingDepartment(List<Department> departments, String departmentName) {
        String normalizedTarget = normalizeDepartmentName(departmentName);
        return departments.stream()
                .filter(department -> normalizeDepartmentName(department.getDepartmentName()).equals(normalizedTarget))
                .findFirst()
                .orElseGet(() -> departments.stream()
                        .filter(department -> {
                            String normalizedName = normalizeDepartmentName(department.getDepartmentName());
                            return normalizedName.contains("tong quat")
                                    || normalizedName.contains("general")
                                    || normalizedName.contains("noi khoa");
                        })
                        .findFirst()
                        .orElse(departments.get(0)));
    }

    private String normalizeDepartmentName(String value) {
        if (value == null) {
            return "";
        }
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutMarks.toLowerCase().trim();
    }

}

