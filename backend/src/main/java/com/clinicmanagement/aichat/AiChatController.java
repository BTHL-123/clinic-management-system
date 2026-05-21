package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.AiSpecialtySuggestionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.aichat.dto.SendChatMessageResponse;
import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ai/chat-sessions")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AiChatSessionResponse>> createSession(
            @Valid @RequestBody CreateAiChatSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AiChatSessionResponse response = aiChatService.createSession(request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SendChatMessageResponse>> sendMessage(
            @PathVariable Long sessionId,
            @Valid @RequestBody AiChatMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SendChatMessageResponse response = aiChatService.sendMessage(sessionId, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{sessionId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<SendChatMessageResponse.MessageDetail>>> getMessages(
            @PathVariable Long sessionId
    ) {
        List<SendChatMessageResponse.MessageDetail> response = aiChatService.getMessages(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/specialty-suggestion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AiSpecialtySuggestionResponse>> generateSuggestion(
            @PathVariable Long sessionId
    ) {
        AiSpecialtySuggestion suggestion = aiChatService.generateSuggestion(sessionId);
        
        AiSpecialtySuggestionResponse response = new AiSpecialtySuggestionResponse(
                suggestion.getSuggestionId(),
                suggestion.getDepartment().getDepartmentId(),
                suggestion.getDepartment().getDepartmentName(),
                suggestion.getConfidenceScore().doubleValue(),
                suggestion.getExplanation()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
