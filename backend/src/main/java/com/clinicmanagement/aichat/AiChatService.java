package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.AiSpecialtySuggestionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.aichat.dto.SendChatMessageResponse;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import org.springframework.security.access.AccessDeniedException;
import java.text.Normalizer;
import java.util.List;

public interface AiChatService {

    AiChatSessionResponse createSession(CreateAiChatSessionRequest request, User currentUser);

    SendChatMessageResponse sendMessage(Long sessionId, AiChatMessageRequest request, User currentUser);

    List<SendChatMessageResponse.MessageDetail> getMessages(Long sessionId, User currentUser);

    AiSpecialtySuggestion generateSuggestion(Long sessionId, User currentUser);

    AiSpecialtySuggestionResponse acceptSuggestion(Long suggestionId, User currentUser);
}
