package com.clinicmanagement.user;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
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

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRoles(new HashSet<>(findRoles(request.roles())));
        return UserMapper.toSummary(userRepository.save(user));
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
