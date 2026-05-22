package com.clinicmanagement.user;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.user.dto.CreateDoctorProfileRequest;
import com.clinicmanagement.user.dto.CreateUserRequest;
import com.clinicmanagement.user.dto.UpdateUserRequest;
import com.clinicmanagement.user.dto.UserSummaryResponse;
import java.util.HashSet;
import java.util.List;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    public Page<UserSummaryResponse> getUsers(String keyword, String status, String role, Pageable pageable) {
        return userRepository.findAll(buildSpecification(keyword, status, role), pageable)
                .map(UserMapper::toSummary);
    }

    public UserSummaryResponse getUserById(Long userId) {
        return UserMapper.toSummary(findUser(userId));
    }

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email already exists");
        }

        List<Role> roles = findRoles(request.roles());

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRoles(new HashSet<>(roles));
        User savedUser = userRepository.save(user);

        if (hasRole(roles, "DOCTOR")) {
            createDoctorProfile(savedUser, request.doctorProfile());
        }

        return UserMapper.toSummary(savedUser);
    }

    @Transactional
    public UserSummaryResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = findUser(userId);
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        return UserMapper.toSummary(user);
    }

    @Transactional
    public void lockUser(Long userId) {
        findUser(userId).setStatus("LOCKED");
    }

    @Transactional
    public void unlockUser(Long userId) {
        findUser(userId).setStatus("ACTIVE");
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(userId);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private List<Role> findRoles(List<String> roleNames) {
        List<Role> roles = roleNames.stream()
                .map(roleName -> roleRepository.findByRoleName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                .toList();
        if (roles.isEmpty()) {
            throw new BusinessException("At least one role is required");
        }
        return roles;
    }

    private boolean hasRole(List<Role> roles, String roleName) {
        return roles.stream().anyMatch(role -> role.getRoleName().equals(roleName));
    }

    private void createDoctorProfile(User user, CreateDoctorProfileRequest profileRequest) {
        if (profileRequest == null) {
            throw new BusinessException("Doctor profile is required when creating a doctor user");
        }
        if (profileRequest.departmentId() == null) {
            throw new BusinessException("Doctor department is required");
        }

        String doctorCode = blankToNull(profileRequest.doctorCode());
        if (doctorCode == null) {
            doctorCode = nextDoctorCode();
        }
        if (doctorRepository.existsByDoctorCode(doctorCode)) {
            throw new BusinessException("Mã bác sĩ đã tồn tại");
        }

        Department department = departmentRepository.findById(profileRequest.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Chuyên khoa với ID: " + profileRequest.departmentId()));

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDepartment(department);
        doctor.setDoctorCode(doctorCode);
        doctor.setDegree(profileRequest.degree());
        doctor.setSpecialization(profileRequest.specialization());
        doctor.setYearsOfExperience(profileRequest.yearsOfExperience() == null ? 0 : profileRequest.yearsOfExperience());
        doctor.setBiography(profileRequest.biography());
        doctor.setConsultationFee(profileRequest.consultationFee());
        doctor.setStatus(blankToNull(profileRequest.status()) == null ? "ACTIVE" : profileRequest.status());
        doctorRepository.save(doctor);
    }

    private String nextDoctorCode() {
        long nextId = doctorRepository.findDoctorCodes().stream()
                .map(this::extractDoctorCodeNumber)
                .flatMapToLong(java.util.OptionalLong::stream)
                .max()
                .orElse(0L) + 1;

        String doctorCode = "DOC%03d".formatted(nextId);
        while (doctorRepository.existsByDoctorCode(doctorCode)) {
            nextId++;
            doctorCode = "DOC%03d".formatted(nextId);
        }
        return doctorCode;
    }

    private java.util.OptionalLong extractDoctorCodeNumber(String doctorCode) {
        if (doctorCode == null || !doctorCode.matches("DOC\\d+")) {
            return java.util.OptionalLong.empty();
        }
        return java.util.OptionalLong.of(Long.parseLong(doctorCode.substring(3)));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Specification<User> buildSpecification(String keyword, String status, String role) {
        return (root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            String normalizedKeyword = blankToNull(keyword);
            if (normalizedKeyword != null) {
                String likePattern = "%" + normalizedKeyword.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), likePattern)
                ));
            }

            String normalizedStatus = blankToNull(status);
            if (normalizedStatus != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), normalizedStatus));
            }

            String normalizedRole = blankToNull(role);
            if (normalizedRole != null) {
                var roleJoin = root.join("roles", JoinType.LEFT);
                predicates.add(criteriaBuilder.equal(roleJoin.get("roleName"), normalizedRole));
                query.distinct(true);
            }

            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
