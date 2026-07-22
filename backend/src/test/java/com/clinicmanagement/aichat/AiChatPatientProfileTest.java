package com.clinicmanagement.aichat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiChatPatientProfileTest {

    @Mock private AiChatSessionRepository sessionRepository;
    @Mock private AiChatMessageRepository messageRepository;
    @Mock private AiSpecialtySuggestionRepository suggestionRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private GeminiService geminiService;

    private AiChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AiChatServiceImpl(
                sessionRepository,
                messageRepository,
                suggestionRepository,
                patientRepository,
                departmentRepository,
                geminiService,
                new ObjectMapper()
        );
    }

    @Test
    void patientAccountWithoutProfileCanCreateAiSession() {
        User user = new User();
        user.setUserId(25L);
        user.setFullName("New Patient");
        user.setEmail("new.patient@example.com");

        when(patientRepository.findListByUserUserId(25L)).thenReturn(List.of());
        when(patientRepository.existsByPatientCode("PAT-U25")).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient patient = invocation.getArgument(0);
            patient.setPatientId(50L);
            return patient;
        });
        when(sessionRepository.save(any(AiChatSession.class))).thenAnswer(invocation -> {
            AiChatSession session = invocation.getArgument(0);
            session.setAiChatSessionId(75L);
            return session;
        });

        AiChatSessionResponse response = service.createSession(
                new CreateAiChatSessionRequest("SYMPTOM_CHECK"), user);

        assertEquals(75L, response.aiChatSessionId());
        assertEquals(50L, response.patientId());
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void existingSelfProfileIsReusedWithoutCreatingMedicalHistory() {
        User user = new User();
        user.setUserId(26L);
        Patient patient = new Patient();
        patient.setPatientId(51L);
        patient.setUser(user);
        patient.setRelationshipToUser("SELF");

        when(patientRepository.findListByUserUserId(26L)).thenReturn(List.of(patient));
        when(sessionRepository.save(any(AiChatSession.class))).thenAnswer(invocation -> {
            AiChatSession session = invocation.getArgument(0);
            session.setAiChatSessionId(76L);
            return session;
        });

        AiChatSessionResponse response = service.createSession(
                new CreateAiChatSessionRequest("SYMPTOM_CHECK"), user);

        assertNotNull(response);
        assertEquals(51L, response.patientId());
        verify(patientRepository, never()).save(any(Patient.class));
    }
}
