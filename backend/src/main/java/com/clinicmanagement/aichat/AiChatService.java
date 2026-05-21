package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiChatSessionRepository sessionRepository;
    private final AiChatMessageRepository messageRepository;
    private final AiSpecialtySuggestionRepository suggestionRepository;
    private final PatientRepository patientRepository;
    private final DepartmentRepository departmentRepository;
    private final GeminiService geminiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional
    public AiChatSessionResponse createSession(CreateAiChatSessionRequest request, User currentUser) {
        // Allow any user to use AI chat (patient is optional for demo)
        Patient patient = patientRepository.findByUser_UserId(currentUser.getUserId())
                .orElse(null);

        AiChatSession session = new AiChatSession();
        session.setPatient(patient);
        session.setSessionType(request.sessionType());

        AiChatSession saved = sessionRepository.save(session);

        Long patientId = (patient != null) ? patient.getPatientId() : null;
        return new AiChatSessionResponse(saved.getAiChatSessionId(), saved.getSessionType(), patientId);
    }

    @Transactional
    public SendChatMessageResponse sendMessage(Long sessionId, AiChatMessageRequest request, User currentUser) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

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
    public List<SendChatMessageResponse.MessageDetail> getMessages(Long sessionId) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        return session.getMessages().stream()
                .map(msg -> new SendChatMessageResponse.MessageDetail(msg.getAiChatMessageId(), msg.getMessageText()))
                .toList();
    }

    @Transactional
    public AiSpecialtySuggestion generateSuggestion(Long sessionId) {
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

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

        Department matchedDept = departments.get(0);
        for (Department d : departments) {
            if (d.getDepartmentName().equalsIgnoreCase(departmentName)) {
                matchedDept = d;
                break;
            }
        }

        AiSpecialtySuggestion suggestion = new AiSpecialtySuggestion();
        suggestion.setSession(session);
        suggestion.setDepartment(matchedDept);
        suggestion.setConfidenceScore(score);
        suggestion.setExplanation(explanation);

        return suggestionRepository.save(suggestion);
    }

}
