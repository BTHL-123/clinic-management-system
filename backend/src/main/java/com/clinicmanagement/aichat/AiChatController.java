package com.clinicmanagement.aichat;

import com.clinicmanagement.aichat.dto.AiChatMessageRequest;
import com.clinicmanagement.aichat.dto.AiChatSessionResponse;
import com.clinicmanagement.aichat.dto.AiSpecialtySuggestionResponse;
import com.clinicmanagement.aichat.dto.CreateAiChatSessionRequest;
import com.clinicmanagement.aichat.dto.SendChatMessageResponse;
import com.clinicmanagement.aichat.dto.StandardizeNoteRequest;
import com.clinicmanagement.aichat.dto.StandardizeNoteResponse;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<AiChatSessionResponse>> createSession(
            @Valid @RequestBody CreateAiChatSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AiChatSessionResponse response = aiChatService.createSession(request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/messages")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<SendChatMessageResponse>> sendMessage(
            @PathVariable Long sessionId,
            @Valid @RequestBody AiChatMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SendChatMessageResponse response = aiChatService.sendMessage(sessionId, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{sessionId}/messages")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<SendChatMessageResponse.MessageDetail>>> getMessages(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<SendChatMessageResponse.MessageDetail> response = aiChatService.getMessages(sessionId, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/specialty-suggestion")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<AiSpecialtySuggestionResponse>> generateSuggestion(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AiSpecialtySuggestion suggestion = aiChatService.generateSuggestion(sessionId, userDetails.getUser());
        
        AiSpecialtySuggestionResponse response = new AiSpecialtySuggestionResponse(
                suggestion.getSuggestionId(),
                suggestion.getDepartment().getDepartmentId(),
                suggestion.getDepartment().getDepartmentName(),
                suggestion.getConfidenceScore().doubleValue(),
                suggestion.getExplanation()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/suggestions/{suggestionId}/accept")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<AiSpecialtySuggestionResponse>> acceptSuggestion(
            @PathVariable Long suggestionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AiSpecialtySuggestionResponse response = aiChatService.acceptSuggestion(suggestionId, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận chọn chuyên khoa", response));
    }

    @PostMapping("/clinical-notes/standardize")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<StandardizeNoteResponse>> standardizeClinicalNote(
            @RequestBody StandardizeNoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        StandardizeNoteResponse response = aiChatService.standardizeClinicalNote(request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
