package com.clinicmanagement.auth;

import com.clinicmanagement.auth.dto.*;
import com.clinicmanagement.user.User;

public interface AuthService {

    RegisterResponse register(RegisterRequest request);

    void sendRegisterOtp(RegisterOtpRequest request);

    LoginResponse login(LoginRequest request);

    LoginResponse loginWithGoogle(GoogleLoginRequest request);

    TokenResponse refreshToken(RefreshTokenRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(User currentUser, ChangePasswordRequest request);
}
