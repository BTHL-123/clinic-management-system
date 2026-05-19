package com.clinicmanagement.auth;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.security.CustomUserDetails;
import com.clinicmanagement.user.UserMapper;
import com.clinicmanagement.user.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(@Valid @RequestBody LogoutRequest request) {
        return ApiResponse.success(Map.of("message", "Logout successfully"));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.success(Map.of("message", "Password reset email has been sent"));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.success(Map.of("message", "Password has been reset successfully"));
    }

    @GetMapping("/me")
    public ApiResponse<UserSummaryResponse> me(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.success(UserMapper.toSummary(currentUser.getUser()));
    }
}
