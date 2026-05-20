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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermissions();
        seedAdmin();
        seedDoctor();
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

    private void seedDoctor() {
        Long departmentId;
        List<Long> deptIds = jdbcTemplate.query("SELECT department_id FROM departments WHERE department_name = 'General Medicine'", (rs, rowNum) -> rs.getLong("department_id"));
        if (deptIds.isEmpty()) {
            jdbcTemplate.update("INSERT INTO departments (department_name, description, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                    "General Medicine", "General medicine department", "ACTIVE");
            departmentId = jdbcTemplate.queryForObject("SELECT department_id FROM departments WHERE department_name = 'General Medicine'", Long.class);
        } else {
            departmentId = deptIds.get(0);
        }

        Role doctorRole = roleRepository.findByRoleName("DOCTOR")
                .orElseThrow(() -> new IllegalStateException("DOCTOR role has not been seeded"));

        String[] emails = {"doctor@example.com", "doctor2@example.com", "doctor3@example.com"};
        String[] names = {"Dr. John Doe", "Dr. Jane Smith", "Dr. Robert Lee"};
        String[] codes = {"DOC001", "DOC002", "DOC003"};
        String[] phones = {"0912345678", "0987654321", "0909090909"};

        for (int i = 0; i < emails.length; i++) {
            Long docId = (long)(i + 1);
            List<Long> existingDoc = jdbcTemplate.query("SELECT doctor_id FROM doctors WHERE doctor_id = ?",
                    (rs, rowNum) -> rs.getLong("doctor_id"), docId);
            if (existingDoc.isEmpty()) {
                Long doctorUserId;
                String email = emails[i];
                List<Long> userIds = jdbcTemplate.query("SELECT user_id FROM users WHERE email = ?",
                        (rs, rowNum) -> rs.getLong("user_id"), email);
                if (userIds.isEmpty()) {
                    jdbcTemplate.update("INSERT INTO users (email, password_hash, full_name, phone, auth_provider, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                            email, passwordEncoder.encode("123456"), names[i], phones[i], "LOCAL", "ACTIVE");
                    doctorUserId = jdbcTemplate.queryForObject("SELECT user_id FROM users WHERE email = ?", Long.class, email);
                    jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", doctorUserId, doctorRole.getRoleId());
                } else {
                    doctorUserId = userIds.get(0);
                }

                jdbcTemplate.update("INSERT INTO doctors (doctor_id, user_id, department_id, doctor_code, degree, specialization, years_of_experience, biography, consultation_fee, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        docId, doctorUserId, departmentId, codes[i], "MD", "General Practitioner", 10 + i, "A highly experienced practitioner", 150000.0, "ACTIVE");
            }
        }

        List<Long> doctorIds = jdbcTemplate.query("SELECT doctor_id FROM doctors", (rs, rowNum) -> rs.getLong("doctor_id"));
        System.out.println("\n=======================================================");
        System.out.println("=== DỰ ÁN CLINIC: DANH SÁCH ID BÁC SĨ ĐANG CÓ: " + doctorIds + " ===");
        System.out.println("=======================================================\n");
    }
}
