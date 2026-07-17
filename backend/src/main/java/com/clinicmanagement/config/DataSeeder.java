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
        seedBillingSettings();
        seedRoles();
        seedPermissions();
        seedAdmin();
        seedDoctor();
        seedPatient();
        seedMedicalRecords();
        seedLabTests();
        seedMedicalServices();
        syncPostgresSequences();
        updateExistingBiographies();
    }

    private void updateExistingBiographies() {
        jdbcTemplate.update("UPDATE doctors SET biography = ? WHERE doctor_code = ?", 
            "Bác sĩ Hoàng Minh là chuyên gia hàng đầu trong lĩnh vực Da liễu với hơn 12 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý về da phức tạp như mụn trứng cá nặng, viêm da cơ địa, vảy nến, và áp dụng công nghệ laser tiên tiến trong thẩm mỹ. Với phương châm 'Chăm sóc da từ gốc', bác sĩ luôn chú trọng phác đồ cá nhân hóa, mang lại làn da khỏe mạnh cho hàng ngàn bệnh nhân.", 
            "DOC001");
        jdbcTemplate.update("UPDATE doctors SET biography = ? WHERE doctor_code = ?", 
            "Bác sĩ Lan Anh có hơn 8 năm gắn bó với chuyên ngành Nội khoa tổng quát. Bác sĩ nổi tiếng với sự tỉ mỉ trong chẩn đoán và điều trị các bệnh lý mạn tính như tiểu đường, huyết áp. Không chỉ điều trị triệu chứng, bác sĩ luôn dành thời gian tư vấn kỹ lưỡng về chế độ dinh dưỡng và lối sống, giúp bệnh nhân quản lý sức khỏe toàn diện và phòng ngừa biến chứng hiệu quả.", 
            "DOC002");
        jdbcTemplate.update("UPDATE doctors SET biography = ? WHERE doctor_code = ?", 
            "Với 12 năm kinh nghiệm tại khoa Tim mạch, Bác sĩ Trần Quốc là người đồng hành đáng tin cậy bảo vệ nhịp đập trái tim của bạn. Bác sĩ chuyên khám, siêu âm tim và điều trị chuyên sâu các bệnh lý như suy tim, rối loạn nhịp. Sự điềm tĩnh và chuyên môn sâu rộng của bác sĩ đã cải thiện chất lượng cuộc sống cho rất nhiều người bệnh.", 
            "DOC003");
        jdbcTemplate.update("UPDATE doctors SET biography = ? WHERE doctor_code = ?", 
            "Bác sĩ Ngọc Mai được các bậc phụ huynh yêu mến gọi là 'người bạn của mọi mầm non'. Hơn 9 năm kinh nghiệm Nhi khoa giúp bác sĩ thấu hiểu tâm lý trẻ nhỏ, mang đến những buổi thăm khám nhẹ nhàng, không nước mắt. Bác sĩ có thế mạnh trong điều trị bệnh lý hô hấp, tiêu hóa, và tư vấn dinh dưỡng, đồng hành cùng ba mẹ trong hành trình khôn lớn của con.", 
            "DOC004");
        jdbcTemplate.update("UPDATE doctors SET biography = ? WHERE doctor_code = ?", 
            "Bác sĩ Kim Oanh là chuyên gia tận tâm trong lĩnh vực Sản phụ khoa với 10 năm kinh nghiệm. Thấu hiểu trăn trở của phái đẹp, bác sĩ chuyên điều trị bệnh lý phụ khoa, tư vấn sức khỏe sinh sản, và đồng hành cùng các mẹ bầu. Bằng sự ân cần và chuyên môn vững vàng, bác sĩ luôn mang đến cảm giác an tâm tuyệt đối cho chị em phụ nữ.", 
            "DOC005");
    }

    private void seedBillingSettings() {
        upsertDefaultSetting("payment.deposit.expiry_minutes", "10", "Online deposit payment expiry in minutes");
        upsertDefaultSetting("refund.full_before_hours", "24", "Hours before appointment for full deposit refund");
        upsertDefaultSetting("refund.partial_before_hours", "2", "Hours before appointment for partial deposit refund");
        upsertDefaultSetting("refund.partial_percent", "50", "Partial refund percentage for late cancellations");
    }

    private void upsertDefaultSetting(String key, String value, String description) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM system_settings WHERE setting_key = ?",
                Integer.class,
                key
        );
        if (count == null || count == 0) {
            jdbcTemplate.update(
                    "INSERT INTO system_settings (setting_key, setting_value, description, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                    key,
                    value,
                    description
            );
        }
    }

    private void seedLabTests() {
        List<Long> existingTests = jdbcTemplate.query(
                "SELECT lab_test_id FROM lab_tests",
                (rs, rowNum) -> rs.getLong("lab_test_id"));
        if (!existingTests.isEmpty()) {
            return;
        }

        jdbcTemplate.update("INSERT INTO lab_tests (test_code, test_name, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "XN01", "Xét nghiệm máu tổng quát", "Kiểm tra hồng cầu, bạch cầu, tiểu cầu", 150000.00, "ACTIVE");
        jdbcTemplate.update("INSERT INTO lab_tests (test_code, test_name, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "XN02", "Đường huyết (Glucose)", "Kiểm tra mức đường trong máu", 50000.00, "ACTIVE");
        jdbcTemplate.update("INSERT INTO lab_tests (test_code, test_name, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "XN03", "Xét nghiệm nước tiểu", "Phân tích 10 thông số nước tiểu", 80000.00, "ACTIVE");
        jdbcTemplate.update("INSERT INTO lab_tests (test_code, test_name, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "XN04", "Men gan (AST/ALT)", "Kiểm tra chức năng gan", 120000.00, "ACTIVE");
        jdbcTemplate.update("INSERT INTO lab_tests (test_code, test_name, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "XN05", "Siêu âm bụng", "Kiểm tra tổng quát nội tạng", 200000.00, "ACTIVE");
    }

    private void seedMedicalServices() {
        String[] codes = {"SV_CONSULT", "SV_XRAY", "SV_ECHO", "SV_ENDO", "SV_ECG", "SV_DENT"};
        String[] names = {"Khám bệnh chuyên khoa", "Chụp X-Quang Phổi", "Siêu âm thai 4D", "Nội soi dạ dày", "Điện tâm đồ (ECG)", "Cạo vôi răng"};
        String[] descs = {"Phí khám lâm sàng ban đầu", "Chụp X-quang kỹ thuật số lồng ngực", "Siêu âm đánh giá hình thái thai nhi", "Nội soi thực quản, dạ dày, tá tràng", "Ghi lại hoạt động điện của tim", "Làm sạch mảng bám, vôi răng"};
        String[] types = {"CONSULTATION", "IMAGING", "IMAGING", "PROCEDURE", "TESTING", "PROCEDURE"};
        double[] prices = {200000.00, 150000.00, 400000.00, 800000.00, 100000.00, 250000.00};

        for (int i = 0; i < codes.length; i++) {
            List<Long> existing = jdbcTemplate.query(
                    "SELECT service_id FROM medical_services WHERE service_code = ?",
                    (rs, rowNum) -> rs.getLong("service_id"), codes[i]);
            if (existing.isEmpty()) {
                jdbcTemplate.update("INSERT INTO medical_services (service_code, service_name, description, service_type, price, status, created_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)",
                        codes[i], names[i], descs[i], types[i], prices[i]);
            }
        }
    }

    private void migrateCheckConstraint() {
        jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            if ("PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName())) {
                try (var statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_status_check");
                    statement.execute("ALTER TABLE appointment_slots ADD CONSTRAINT appointment_slots_status_check CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED', 'CANCELLED'))");

                    statement.execute("ALTER TABLE medicine_batches DROP CONSTRAINT IF EXISTS medicine_batches_status_check");
                    statement.execute("ALTER TABLE medicine_batches ADD CONSTRAINT medicine_batches_status_check CHECK (status IN ('AVAILABLE', 'LOW_STOCK', 'EXPIRED', 'OUT_OF_STOCK', 'CANCELLED'))");

                    statement.execute("ALTER TABLE medical_services DROP CONSTRAINT IF EXISTS medical_services_service_type_check");
                    statement.execute("ALTER TABLE medical_services ADD CONSTRAINT medical_services_service_type_check CHECK (service_type IN ('CONSULTATION', 'LAB_TEST', 'PACKAGE', 'OTHER', 'IMAGING', 'TESTING', 'PROCEDURE'))");

                    statement.execute("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
                    statement.execute("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS', 'PAYMENT_DUE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'))");

                    statement.execute("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
                    statement.execute("UPDATE invoices SET status = 'UNPAID' WHERE status = 'PENDING'");
                    statement.execute("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'))");

                    statement.execute("ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_item_type_check");
                    statement.execute("ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_item_type_check CHECK (item_type IN ('CONSULTATION', 'LAB_TEST', 'MEDICINE', 'SERVICE', 'DEPOSIT'))");

                    statement.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check");
                    statement.execute("UPDATE payments SET status = 'PENDING' WHERE status = 'UNPAID'");
                    statement.execute("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'))");
                    statement.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP");

                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_method VARCHAR(30)");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50)");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(150)");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_transaction_ref VARCHAR(255)");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_by BIGINT");
                    statement.execute("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP");

                    statement.execute("ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_reference_type_check");
                    statement.execute("ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_reference_type_check CHECK (reference_type IN ('PRESCRIPTION', 'MANUAL', 'SUPPLIER_IMPORT', 'INVOICE', 'OTHER'))");
                } catch (Exception e) {
                    System.err.println("Migration of check constraints failed: " + e.getMessage());
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

        String[] emails = {"doctor@example.com", "doctor2@example.com", "doctor3@example.com", "doctor4@example.com", "doctor5@example.com"};
        String[] names = {"BS. Hoàng Minh", "BS. Lan Anh", "BS. Trần Quốc", "BS. Ngọc Mai", "BS. Kim Oanh"};
        String[] codes = {"DOC001", "DOC002", "DOC003", "DOC004", "DOC005"};
        String[] phones = {"0912345678", "0987654321", "0909090909", "0911111111", "0922222222"};
        String[] avatars = {
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=420&q=85",
            "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=420&q=85",
            "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=420&q=85",
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=420&q=85",
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=420&q=85"
        };
        String[] specialties = {"Da liễu", "Nội khoa", "Tim mạch", "Nhi khoa", "Sản phụ khoa"};
        int[] exps = {12, 8, 12, 9, 10};
        String[] biographies = {
            "Bác sĩ Hoàng Minh là chuyên gia hàng đầu trong lĩnh vực Da liễu với hơn 12 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý về da phức tạp như mụn trứng cá nặng, viêm da cơ địa, vảy nến, và áp dụng công nghệ laser tiên tiến trong thẩm mỹ. Với phương châm 'Chăm sóc da từ gốc', bác sĩ luôn chú trọng phác đồ cá nhân hóa, mang lại làn da khỏe mạnh cho hàng ngàn bệnh nhân.",
            "Bác sĩ Lan Anh có hơn 8 năm gắn bó với chuyên ngành Nội khoa tổng quát. Bác sĩ nổi tiếng với sự tỉ mỉ trong chẩn đoán và điều trị các bệnh lý mạn tính như tiểu đường, huyết áp. Không chỉ điều trị triệu chứng, bác sĩ luôn dành thời gian tư vấn kỹ lưỡng về chế độ dinh dưỡng và lối sống, giúp bệnh nhân quản lý sức khỏe toàn diện và phòng ngừa biến chứng hiệu quả.",
            "Với 12 năm kinh nghiệm tại khoa Tim mạch, Bác sĩ Trần Quốc là người đồng hành đáng tin cậy bảo vệ nhịp đập trái tim của bạn. Bác sĩ chuyên khám, siêu âm tim và điều trị chuyên sâu các bệnh lý như suy tim, rối loạn nhịp. Sự điềm tĩnh và chuyên môn sâu rộng của bác sĩ đã cải thiện chất lượng cuộc sống cho rất nhiều người bệnh.",
            "Bác sĩ Ngọc Mai được các bậc phụ huynh yêu mến gọi là 'người bạn của mọi mầm non'. Hơn 9 năm kinh nghiệm Nhi khoa giúp bác sĩ thấu hiểu tâm lý trẻ nhỏ, mang đến những buổi thăm khám nhẹ nhàng, không nước mắt. Bác sĩ có thế mạnh trong điều trị bệnh lý hô hấp, tiêu hóa, và tư vấn dinh dưỡng, đồng hành cùng ba mẹ trong hành trình khôn lớn của con.",
            "Bác sĩ Kim Oanh là chuyên gia tận tâm trong lĩnh vực Sản phụ khoa với 10 năm kinh nghiệm. Thấu hiểu trăn trở của phái đẹp, bác sĩ chuyên điều trị bệnh lý phụ khoa, tư vấn sức khỏe sinh sản, và đồng hành cùng các mẹ bầu. Bằng sự ân cần và chuyên môn vững vàng, bác sĩ luôn mang đến cảm giác an tâm tuyệt đối cho chị em phụ nữ."
        };
        String[] hometowns = {"Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"};

        for (int i = 0; i < emails.length; i++) {
            String email = emails[i];
            Long doctorUserId;
            List<Long> userIds = jdbcTemplate.query("SELECT user_id FROM users WHERE email = ?",
                    (rs, rowNum) -> rs.getLong("user_id"), email);
            if (userIds.isEmpty()) {
                jdbcTemplate.update("INSERT INTO users (email, password_hash, full_name, avatar_url, phone, auth_provider, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        email, passwordEncoder.encode("123456"), names[i], avatars[i], phones[i], "LOCAL", "ACTIVE");
                doctorUserId = jdbcTemplate.queryForObject("SELECT user_id FROM users WHERE email = ?", Long.class, email);
                jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", doctorUserId, doctorRole.getRoleId());
            } else {
                doctorUserId = userIds.get(0);
                jdbcTemplate.update("UPDATE users SET full_name = ?, avatar_url = ? WHERE user_id = ?", names[i], avatars[i], doctorUserId);
            }

            List<Long> existingDoc = jdbcTemplate.query("SELECT doctor_id FROM doctors WHERE user_id = ?",
                    (rs, rowNum) -> rs.getLong("doctor_id"), doctorUserId);
            
            if (existingDoc.isEmpty()) {
                jdbcTemplate.update("INSERT INTO doctors (user_id, department_id, doctor_code, degree, specialization, years_of_experience, biography, hometown, consultation_fee, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        doctorUserId, departmentId, codes[i], "MD", specialties[i], exps[i], biographies[i], hometowns[i], 150000.0, "ACTIVE");
            } else {
                jdbcTemplate.update("UPDATE doctors SET specialization = ?, years_of_experience = ?, biography = ?, hometown = ? WHERE doctor_id = ?", specialties[i], exps[i], biographies[i], hometowns[i], existingDoc.get(0));
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

        jdbcTemplate.update("INSERT INTO patients (user_id, patient_code, full_name, gender, phone, email, relationship_to_user, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                savedUser.getUserId(), "PAT000001", "Nguyễn Văn Test", "MALE", "0911222333", email, "SELF");
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
            
            jdbcTemplate.update("INSERT INTO appointments (appointment_id, appointment_code, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, booking_type, status, deposit_amount, reminder_sent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, '08:00', '08:30', 'ONLINE', 'COMPLETED', 0.0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1001, "APP1001", patientId, doctorId1, deptId1);
            jdbcTemplate.update("INSERT INTO consultation_sessions (consultation_id, appointment_id, patient_id, doctor_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1001, 1001, patientId, doctorId1);

            jdbcTemplate.update("INSERT INTO appointments (appointment_id, appointment_code, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, booking_type, status, deposit_amount, reminder_sent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, '09:00', '09:30', 'ONLINE', 'COMPLETED', 0.0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", 1002, "APP1002", patientId, doctorId2, deptId2);
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
        syncPostgresSequence("lab_tests", "lab_test_id");
        syncPostgresSequence("medical_services", "service_id");
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
