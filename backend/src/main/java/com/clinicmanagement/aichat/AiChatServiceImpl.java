package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.AiSpecialtySuggestionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.aichat.dto.SendChatMessageResponse;
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
                new SendChatMessageResponse.MessageDetail(savedPatientMsg.getAiChatMessageId(), savedPatientMsg.getMessageText()),
                new SendChatMessageResponse.MessageDetail(savedAiMsg.getAiChatMessageId(), savedAiMsg.getMessageText())
        );
    }

    @Transactional(readOnly = true)
    @Override
    public List<SendChatMessageResponse.MessageDetail> getMessages(Long sessionId, User currentUser) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        validateSessionOwner(session, currentUser);

        return session.getMessages().stream()
                .map(msg -> new SendChatMessageResponse.MessageDetail(msg.getAiChatMessageId(), msg.getMessageText()))
                .toList();
    }

    @Transactional
    @Override
    public AiSpecialtySuggestion generateSuggestion(Long sessionId, User currentUser) {
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
        java.math.BigDecimal score = java.math.BigDecimal.valueOf(80.0);
        String explanation = "Dựa trên các triệu chứng cơ bản, chúng tôi đề xuất bạn khám tổng quát để được chẩn đoán chính xác hơn.";

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
            if (root.has("departmentName")) {
                departmentName = root.get("departmentName").asText();
            }
            if (root.has("confidenceScore")) {
                score = java.math.BigDecimal.valueOf(root.get("confidenceScore").asDouble());
            }
            if (root.has("explanation")) {
                explanation = root.get("explanation").asText();
            }
        } catch (Exception e) {
            // Fallback if parsing fails
        }

        Department matchedDept = findMatchingDepartment(departments, departmentName);
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
                .filter(message -> "PATIENT".equalsIgnoreCase(message.getSenderType()))
                .map(AiChatMessage::getMessageText)
                .reduce((left, right) -> left + "\n" + right)
                .orElse(""));
        suggestion.setConfidenceScore(score);
        suggestion.setExplanation(explanation);

        return suggestionRepository.save(suggestion);
    }

    @Transactional
    @Override
    public AiSpecialtySuggestionResponse acceptSuggestion(Long suggestionId, User currentUser) {
        AiSpecialtySuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả gợi ý chuyên khoa"));

        if (suggestion.getPatient() == null || suggestion.getPatient().getUser() == null ||
                !suggestion.getPatient().getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên gợi ý này");
        }

        suggestion.setAcceptedByPatient(true);
        AiSpecialtySuggestion saved = suggestionRepository.save(suggestion);

        return new AiSpecialtySuggestionResponse(
                saved.getSuggestionId(),
                saved.getDepartment().getDepartmentId(),
                saved.getDepartment().getDepartmentName(),
                saved.getConfidenceScore().doubleValue(),
                saved.getExplanation()
        );
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

