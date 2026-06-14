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
        migrateCheckConstraint();
        seedRoles();
        seedPermissions();
        seedAdmin();
        seedDoctor();
        seedPatient();
        seedMedicalRecords();
        syncPostgresSequences();
    }

    private void migrateCheckConstraint() {
        jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            if ("PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName())) {
                try (var statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_status_check");
                    statement.execute("ALTER TABLE appointment_slots ADD CONSTRAINT appointment_slots_status_check CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED', 'CANCELLED'))");
                } catch (Exception e) {
                    System.err.println("Migration of appointment_slots_status_check failed: " + e.getMessage());
                }
            }
            return null;
        });
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
            String email = emails[i];
            Long doctorUserId;
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

            List<Long> existingDoc = jdbcTemplate.query("SELECT doctor_id FROM doctors WHERE user_id = ?",
                    (rs, rowNum) -> rs.getLong("doctor_id"), doctorUserId);
            
            if (existingDoc.isEmpty()) {
                jdbcTemplate.update("INSERT INTO doctors (user_id, department_id, doctor_code, degree, specialization, years_of_experience, biography, consultation_fee, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        doctorUserId, departmentId, codes[i], "MD", "General Practitioner", 10 + i, "A highly experienced practitioner", 150000.0, "ACTIVE");
            }
        }
        List<Long> doctorIds = jdbcTemplate.query("SELECT doctor_id FROM doctors", (rs, rowNum) -> rs.getLong("doctor_id"));
        System.out.println("\n=======================================================");
        System.out.println("=== DỰ ÁN CLINIC: DANH SÁCH ID BÁC SĨ ĐANG CÓ: " + doctorIds + " ===");
        System.out.println("=======================================================\n");
    }

    private void seedPatient() {
        String email = "patient@example.com";
        if (userRepository.existsByEmail(email)) {
            return;
        }
        Role patientRole = roleRepository.findByRoleName("PATIENT")
                .orElseThrow(() -> new IllegalStateException("PATIENT role has not been seeded"));
        User patient = new User();
        patient.setFullName("Nguyễn Văn Test");
        patient.setEmail(email);
        patient.setPhone("0911222333");
        patient.setPasswordHash(passwordEncoder.encode("123456"));
        patient.setRoles(Set.of(patientRole));
        User savedUser = userRepository.save(patient);

        jdbcTemplate.update("INSERT INTO patients (user_id, patient_code, full_name, gender, phone, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                savedUser.getUserId(), "PAT000001", "Nguyễn Văn Test", "MALE", "0911222333", email);
    }

    private void seedMedicalRecords() {
        // Kiểm tra xem đã có dữ liệu test chưa
        List<Long> existingRecords = jdbcTemplate.query(
                "SELECT medical_record_id FROM medical_records WHERE consultation_id = 1001",
                (rs, rowNum) -> rs.getLong("medical_record_id"));
        if (!existingRecords.isEmpty()) {
            return; // Đã seed rồi
        }

        // Lấy patient_id và doctor_id đã có
        List<Long> patientIds = jdbcTemplate.query(
                "SELECT patient_id FROM patients ORDER BY patient_id LIMIT 1",
                (rs, rowNum) -> rs.getLong("patient_id"));
        List<Long> doctorIds = jdbcTemplate.query(
                "SELECT doctor_id FROM doctors ORDER BY doctor_id LIMIT 2",
                (rs, rowNum) -> rs.getLong("doctor_id"));

        if (patientIds.isEmpty() || doctorIds.isEmpty()) {
            return; // Chưa có patient/doctor nào
        }

        Long patientId = patientIds.get(0);
        Long doctorId1 = doctorIds.get(0);
        Long doctorId2 = doctorIds.size() > 1 ? doctorIds.get(1) : doctorId1;

        List<Long> existingSessions = jdbcTemplate.query(
                "SELECT consultation_id FROM consultation_sessions WHERE consultation_id = 1001",
                (rs, rowNum) -> rs.getLong("consultation_id"));
        if (existingSessions.isEmpty()) {
            Long deptId1 = jdbcTemplate.queryForObject("SELECT department_id FROM doctors WHERE doctor_id = ?", Long.class, doctorId1);
            Long deptId2 = jdbcTemplate.queryForObject("SELECT department_id FROM doctors WHERE doctor_id = ?", Long.class, doctorId2);
            
            jdbcTemplate.update("INSERT INTO appointments (appointment_id, appointment_code, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, booking_type, status, deposit_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, '08:00', '08:30', 'ONLINE', 'COMPLETED', 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1001, "APP1001", patientId, doctorId1, deptId1);
            jdbcTemplate.update("INSERT INTO consultation_sessions (consultation_id, appointment_id, patient_id, doctor_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1001, 1001, patientId, doctorId1);

            jdbcTemplate.update("INSERT INTO appointments (appointment_id, appointment_code, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, booking_type, status, deposit_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, '09:00', '09:30', 'ONLINE', 'COMPLETED', 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1002, "APP1002", patientId, doctorId2, deptId2);
            jdbcTemplate.update("INSERT INTO consultation_sessions (consultation_id, appointment_id, patient_id, doctor_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1002, 1002, patientId, doctorId2);
        }

        // Bệnh án 1: Viêm loét dạ dày
        jdbcTemplate.update("""
                INSERT INTO medical_records (consultation_id, patient_id, doctor_id, symptoms, clinical_findings, diagnosis, treatment_plan, doctor_note, follow_up_date, follow_up_note, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                1001, patientId, doctorId1,
                "Dau bung, buon non, sot nhe 37.8C",
                "Bung an dau vung thuong vi",
                "Viem loet da day cap",
                "Dung thuoc khang acid + khang sinh 7 ngay",
                "Benh nhan can kieng do cay nong. Tai kham sau 2 tuan.",
                java.time.LocalDate.of(2026, 6, 10),
                "Kiem tra lai noi soi da day",
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusDays(14)),
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusDays(14)));

        // Bệnh án 2: Viêm phế quản
        jdbcTemplate.update("""
                INSERT INTO medical_records (consultation_id, patient_id, doctor_id, symptoms, clinical_findings, diagnosis, treatment_plan, doctor_note, follow_up_date, follow_up_note, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                1002, patientId, doctorId2,
                "Ho khan keo dai, kho tho khi ngu",
                "Phoi nghe ran am hai ben",
                "Viem phe quan cap",
                "Thuoc giam ho + khang sinh + xi-ro long dom",
                "Uong nhieu nuoc am, nghi ngoi. Tai kham neu khong giam sau 5 ngay.",
                java.time.LocalDate.of(2026, 6, 5),
                "Chup X-quang phoi neu con ho",
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusDays(7)),
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusDays(7)));

        System.out.println("\n=== SEED: Da tao 2 ban ghi medical_records cho patient_id=" + patientId + " ===");
    }

    private void syncPostgresSequences() {
        syncPostgresSequence("doctors", "doctor_id");
        syncPostgresSequence("doctor_schedules", "schedule_id");
        syncPostgresSequence("appointment_slots", "slot_id");
        syncPostgresSequence("appointments", "appointment_id");
        syncPostgresSequence("consultation_sessions", "consultation_id");
        syncPostgresSequence("medical_records", "medical_record_id");
    }

    private void syncPostgresSequence(String tableName, String idColumn) {
        jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            if (!"PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName())) {
                return null;
            }

            String sequenceName = tableName + "_" + idColumn + "_seq";
            String sql = """
                    SELECT setval(
                        '%s',
                        COALESCE((SELECT MAX(%s) FROM %s), 1),
                        (SELECT MAX(%s) IS NOT NULL FROM %s)
                    )
                    """.formatted(sequenceName, idColumn, tableName, idColumn, tableName);
            try (var statement = connection.createStatement()) {
                statement.execute(sql);
            }
            return null;
        });
    }
}
