package com.clinicmanagement.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateUserRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @Size(max = 20) String phone,
        @NotEmpty List<String> roles,
        @Valid CreateDoctorProfileRequest doctorProfile
) {
}
