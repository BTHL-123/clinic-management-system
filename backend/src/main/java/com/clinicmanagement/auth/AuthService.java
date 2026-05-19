package com.clinicmanagement.auth;

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
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email already exists");
        }

        Role patientRole = roleRepository.findByRoleName("PATIENT")
                .orElseThrow(() -> new BusinessException("PATIENT role has not been seeded"));

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRoles(Set.of(patientRole));
        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setPatientCode(nextPatientCode());
        patient.setFullName(request.fullName());
        patient.setGender(normalizeGender(request.gender()));
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setAddress(request.address());
        Patient savedPatient = patientRepository.save(patient);

        return new RegisterResponse(savedUser.getUserId(), savedPatient.getPatientId(), savedUser.getEmail(), "PATIENT");
    }

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
