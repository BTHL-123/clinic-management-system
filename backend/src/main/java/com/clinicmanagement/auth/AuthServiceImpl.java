package com.clinicmanagement.auth;

import com.clinicmanagement.auth.dto.*;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.security.CustomUserDetails;
import com.clinicmanagement.security.JwtService;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserMapper;
import com.clinicmanagement.user.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailOtpService emailOtpService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Transactional
    @Override
    public RegisterResponse register(RegisterRequest request) {
        String email = emailOtpService.normalizeEmail(request.email());
        emailOtpService.verifyAndConsume(email, EmailOtpService.PURPOSE_REGISTER, request.otpCode());

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email already exists");
        }

        Role patientRole = roleRepository.findByRoleName("PATIENT")
                .orElseThrow(() -> new BusinessException("PATIENT role has not been seeded"));

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRoles(Set.of(patientRole));
        User savedUser = userRepository.save(user);

        Patient patient = null;
        if (request.phone() != null && !request.phone().isBlank()) {
            patient = patientRepository.findTopByPhone(request.phone().trim()).orElse(null);
        }

        if (patient == null) {
            patient = new Patient();
            patient.setPatientCode(nextPatientCode());
            patient.setFullName(request.fullName());
            patient.setGender(normalizeGender(request.gender()));
            patient.setDateOfBirth(request.dateOfBirth());
            patient.setPhone(request.phone());
            patient.setEmail(email);
            patient.setAddress(request.address());
        } else {
            // Update email if it was missing
            if (patient.getEmail() == null || patient.getEmail().isBlank()) {
                patient.setEmail(email);
            }
        }
        
        patient.setUser(savedUser);
        Patient savedPatient = patientRepository.save(patient);

        return new RegisterResponse(savedUser.getUserId(), savedPatient.getPatientId(), savedUser.getEmail(), "PATIENT");
    }

    @Override
    public void sendRegisterOtp(RegisterOtpRequest request) {
        String email = emailOtpService.normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email already exists");
        }
        emailOtpService.createAndSend(email, EmailOtpService.PURPOSE_REGISTER);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                UserMapper.toSummary(user)
        );
    }

    @Transactional
    @Override
    public LoginResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new BusinessException("Google account email is missing");
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BusinessException("Google account email has not been verified");
        }

        String providerId = payload.getSubject();
        String fullName = firstNonBlank((String) payload.get("name"), email);
        String avatarUrl = (String) payload.get("picture");

        User user = userRepository.findByEmail(email)
                .map(existingUser -> linkGoogleAccount(existingUser, providerId, avatarUrl))
                .orElseGet(() -> createGooglePatientUser(email, fullName, providerId, avatarUrl));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BusinessException("User account is not active");
        }

        CustomUserDetails userDetails = new CustomUserDetails(user);
        return new LoginResponse(
                jwtService.generateAccessToken(userDetails),
                jwtService.generateRefreshToken(userDetails),
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                UserMapper.toSummary(user)
        );
    }

    @Override
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String username = jwtService.extractUsername(request.refreshToken());
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));
        CustomUserDetails userDetails = new CustomUserDetails(user);
        if (!jwtService.isTokenValid(request.refreshToken(), userDetails)) {
            throw new BusinessException("Invalid refresh token");
        }

        return new TokenResponse(
                jwtService.generateAccessToken(userDetails),
                jwtService.generateRefreshToken(userDetails),
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds()
        );
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = emailOtpService.normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Email does not exist"));
        if (!"LOCAL".equals(user.getAuthProvider()) || user.getPasswordHash() == null) {
            throw new BusinessException("This account cannot reset password by email OTP");
        }
        emailOtpService.createAndSend(email, EmailOtpService.PURPOSE_RESET_PASSWORD);
    }

    @Transactional
    @Override
    public void resetPassword(ResetPasswordRequest request) {
        String email = emailOtpService.normalizeEmail(request.email());
        emailOtpService.verifyAndConsume(email, EmailOtpService.PURPOSE_RESET_PASSWORD, request.otpCode());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Email does not exist"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        if (!"LOCAL".equals(currentUser.getAuthProvider()) || currentUser.getPasswordHash() == null) {
            throw new BusinessException("This account cannot change local password");
        }
        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }
        currentUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(currentUser);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new BusinessException("Google login has not been configured");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        try {
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new BusinessException("Invalid Google ID token");
            }
            return googleIdToken.getPayload();
        } catch (GeneralSecurityException | IOException exception) {
            throw new BusinessException("Unable to verify Google ID token");
        }
    }

    private User linkGoogleAccount(User user, String providerId, String avatarUrl) {
        if (user.getProviderId() != null && !user.getProviderId().isBlank() && !user.getProviderId().equals(providerId)) {
            throw new BusinessException("This email is already linked to another Google account");
        }

        user.setAuthProvider("GOOGLE");
        user.setProviderId(providerId);
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            user.setAvatarUrl(avatarUrl);
        }
        return userRepository.save(user);
    }

    private User createGooglePatientUser(String email, String fullName, String providerId, String avatarUrl) {
        Role patientRole = roleRepository.findByRoleName("PATIENT")
                .orElseThrow(() -> new BusinessException("PATIENT role has not been seeded"));

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setAvatarUrl(avatarUrl);
        user.setAuthProvider("GOOGLE");
        user.setProviderId(providerId);
        user.setRoles(Set.of(patientRole));
        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setPatientCode(nextPatientCode());
        patient.setFullName(fullName);
        patient.setGender("OTHER");
        patient.setEmail(email);
        patientRepository.save(patient);

        return savedUser;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }

    private String nextPatientCode() {
        Long nextId = patientRepository.findTopByOrderByPatientIdDesc()
                .map(patient -> patient.getPatientId() + 1)
                .orElse(1L);
        return "PAT%06d".formatted(nextId);
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) {
            return "OTHER";
        }
        String normalized = gender.toUpperCase();
        return switch (normalized) {
            case "MALE", "FEMALE", "OTHER" -> normalized;
            default -> "OTHER";
        };
    }
}


