package com.clinicmanagement.config;

import com.clinicmanagement.permission.Permission;
import com.clinicmanagement.permission.PermissionRepository;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermissions();
        seedAdmin();
    }

    private void seedRoles() {
        List.of("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN", "PHARMACIST", "LAB_TECHNICIAN")
                .forEach(roleName -> roleRepository.findByRoleName(roleName).orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(roleName);
                    return roleRepository.save(role);
                }));
    }

    private void seedPermissions() {
        List.of(
                "MANAGE_USERS",
                "MANAGE_DOCTORS",
                "MANAGE_STAFF",
                "MANAGE_DEPARTMENTS",
                "VIEW_PATIENT_RECORD",
                "CREATE_APPOINTMENT",
                "MANAGE_APPOINTMENT",
                "CREATE_PRESCRIPTION",
                "MANAGE_MEDICINE_STOCK",
                "VIEW_REPORT",
                "MANAGE_SETTINGS"
        ).forEach(permissionCode -> {
            if (!permissionRepository.existsByPermissionCode(permissionCode)) {
                Permission permission = new Permission();
                permission.setPermissionCode(permissionCode);
                permissionRepository.save(permission);
            }
        });
    }

    private void seedAdmin() {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }
        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role has not been seeded"));
        User admin = new User();
        admin.setFullName("System Admin");
        admin.setEmail(adminEmail);
        admin.setPhone("0900000000");
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);
    }
}
