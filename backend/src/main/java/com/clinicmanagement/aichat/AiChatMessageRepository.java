package com.clinicmanagement.aichat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {
    List<AiChatMessage> findBySessionAiChatSessionIdOrderByCreatedAtAsc(Long sessionId);
}
