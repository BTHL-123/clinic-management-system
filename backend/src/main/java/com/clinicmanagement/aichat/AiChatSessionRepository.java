package com.clinicmanagement.aichat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {
    List<AiChatSession> findByPatientPatientIdOrderByCreatedAtDesc(Long patientId);
}
