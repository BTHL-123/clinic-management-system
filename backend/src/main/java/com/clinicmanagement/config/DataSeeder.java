package com.clinicmanagement.config;

import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.lab.LabTest;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.medicalservice.MedicalService;
import com.clinicmanagement.medicalservice.MedicalServiceRepository;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.permission.Permission;
import com.clinicmanagement.permission.PermissionRepository;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.systemsetting.SystemSetting;
import com.clinicmanagement.systemsetting.SystemSettingRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Creates the minimum reference data needed by a new clinic installation.
 *
 * <p>This runner is deliberately idempotent: it never changes existing catalog data and never
 * creates patients, appointments, payments, demo doctors, or medical records.</p>
 */
@Component
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final List<DepartmentSeed> DEPARTMENTS = List.of(
            new DepartmentSeed("Nội tổng quát", "Khám và điều trị các bệnh lý nội khoa thông thường."),
            new DepartmentSeed("Da liễu", "Khám và điều trị các bệnh lý về da, tóc và móng."),
            new DepartmentSeed("Tim mạch", "Khám, chẩn đoán và điều trị các bệnh lý tim mạch."),
            new DepartmentSeed("Nhi khoa", "Chăm sóc sức khỏe cho trẻ em."),
            new DepartmentSeed("Sản - Phụ khoa", "Chăm sóc sức khỏe sinh sản và phụ khoa."),
            new DepartmentSeed("Chấn thương chỉnh hình", "Khám và điều trị cơ xương khớp."),
            new DepartmentSeed("Răng - Hàm - Mặt", "Khám và điều trị các bệnh lý răng miệng.")
    );

    private static final List<ServiceSeed> MEDICAL_SERVICES = List.of(
            new ServiceSeed("SV_CONSULT", "Khám chuyên khoa", "CONSULTATION", "Phí khám lâm sàng ban đầu.", "200000"),
            new ServiceSeed("SV_XRAY", "Chụp X-quang phổi", "IMAGING", "Chụp X-quang kỹ thuật số lồng ngực.", "150000"),
            new ServiceSeed("SV_ECHO", "Siêu âm thai 4D", "IMAGING", "Siêu âm đánh giá hình thái thai nhi.", "400000"),
            new ServiceSeed("SV_ENDO", "Nội soi dạ dày", "PROCEDURE", "Nội soi thực quản, dạ dày và tá tràng.", "800000"),
            new ServiceSeed("SV_ECG", "Điện tâm đồ (ECG)", "TESTING", "Ghi lại hoạt động điện của tim.", "100000"),
            new ServiceSeed("SV_DENT", "Cạo vôi răng", "PROCEDURE", "Làm sạch mảng bám và vôi răng.", "250000")
    );

    private static final List<LabTestSeed> LAB_TESTS = List.of(
            new LabTestSeed("XN01", "Xét nghiệm máu tổng quát", "Kiểm tra hồng cầu, bạch cầu và tiểu cầu.", "150000"),
            new LabTestSeed("XN02", "Đường huyết (Glucose)", "Kiểm tra mức đường trong máu.", "50000"),
            new LabTestSeed("XN03", "Xét nghiệm nước tiểu", "Phân tích các chỉ số nước tiểu cơ bản.", "80000"),
            new LabTestSeed("XN04", "Men gan (AST/ALT)", "Kiểm tra chức năng gan.", "120000"),
            new LabTestSeed("XN05", "Siêu âm bụng", "Khảo sát tổng quát các cơ quan ổ bụng.", "200000")
    );

    private static final List<MedicineSeed> MEDICINES = List.of(
            new MedicineSeed("MED001", "Paracetamol 500mg", "Paracetamol", "Viên nén", "500mg", "Viên", "Giảm đau, hạ sốt theo chỉ định."),
            new MedicineSeed("MED002", "Ibuprofen 400mg", "Ibuprofen", "Viên nén", "400mg", "Viên", "Giảm đau, kháng viêm theo chỉ định."),
            new MedicineSeed("MED003", "Amoxicillin 500mg", "Amoxicillin", "Viên nang", "500mg", "Viên", "Kháng sinh, chỉ dùng theo đơn bác sĩ."),
            new MedicineSeed("MED004", "Omeprazole 20mg", "Omeprazole", "Viên nang", "20mg", "Viên", "Hỗ trợ điều trị các bệnh lý dạ dày theo chỉ định."),
            new MedicineSeed("MED005", "Cetirizine 10mg", "Cetirizine", "Viên nén", "10mg", "Viên", "Điều trị triệu chứng dị ứng theo chỉ định."),
            new MedicineSeed("MED006", "Metformin 500mg", "Metformin", "Viên nén", "500mg", "Viên", "Điều trị đái tháo đường theo chỉ định."),
            new MedicineSeed("MED007", "Amlodipine 5mg", "Amlodipine", "Viên nén", "5mg", "Viên", "Điều trị tăng huyết áp theo chỉ định."),
            new MedicineSeed("MED008", "Salbutamol 2mg", "Salbutamol", "Viên nén", "2mg", "Viên", "Điều trị co thắt phế quản theo chỉ định."),
            new MedicineSeed("MED009", "Oresol", "Oral rehydration salts", "Gói bột", "27.9g", "Gói", "Bù nước và điện giải theo hướng dẫn."),
            new MedicineSeed("MED010", "Vitamin C 500mg", "Ascorbic acid", "Viên nén", "500mg", "Viên", "Bổ sung vitamin C theo chỉ định.")
    );

    private final DepartmentRepository departmentRepository;
    private final LabTestRepository labTestRepository;
    private final MedicalServiceRepository medicalServiceRepository;
    private final MedicineRepository medicineRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email:}")
    private String adminEmail;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.admin-full-name:System Administrator}")
    private String adminFullName;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedPermissions();
        seedBillingSettings();
        seedDepartments();
        seedMedicalServices();
        seedLabTests();
        seedMedicines();
        seedAdmin();
        log.info("Baseline clinic catalog seeding completed");
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
                "MANAGE_USERS", "MANAGE_DOCTORS", "MANAGE_STAFF", "MANAGE_DEPARTMENTS",
                "VIEW_PATIENT_RECORD", "CREATE_APPOINTMENT", "MANAGE_APPOINTMENT",
                "CREATE_PRESCRIPTION", "MANAGE_MEDICINE_STOCK", "VIEW_REPORT", "MANAGE_SETTINGS"
        ).forEach(permissionCode -> {
            if (!permissionRepository.existsByPermissionCode(permissionCode)) {
                Permission permission = new Permission();
                permission.setPermissionCode(permissionCode);
                permissionRepository.save(permission);
            }
        });
    }

    private void seedBillingSettings() {
        seedSetting("payment.deposit.expiry_minutes", "10", "Online deposit payment expiry in minutes");
        seedSetting("refund.full_before_hours", "24", "Hours before appointment for full deposit refund");
        seedSetting("refund.partial_before_hours", "2", "Hours before appointment for partial deposit refund");
        seedSetting("refund.partial_percent", "50", "Partial refund percentage for late cancellations");
    }

    private void seedSetting(String key, String value, String description) {
        if (systemSettingRepository.existsBySettingKey(key)) {
            return;
        }
        SystemSetting setting = new SystemSetting();
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        setting.setDescription(description);
        systemSettingRepository.save(setting);
    }

    private void seedDepartments() {
        DEPARTMENTS.forEach(seed -> {
            if (departmentRepository.existsByDepartmentNameIgnoreCase(seed.name())) {
                return;
            }
            Department department = new Department();
            department.setDepartmentName(seed.name());
            department.setDescription(seed.description());
            department.setStatus("ACTIVE");
            departmentRepository.save(department);
        });
    }

    private void seedMedicalServices() {
        MEDICAL_SERVICES.forEach(seed -> {
            if (medicalServiceRepository.existsByServiceCodeIgnoreCase(seed.code())) {
                return;
            }
            MedicalService service = new MedicalService();
            service.setServiceCode(seed.code());
            service.setServiceName(seed.name());
            service.setServiceType(seed.type());
            service.setDescription(seed.description());
            service.setPrice(new BigDecimal(seed.price()));
            service.setStatus("ACTIVE");
            medicalServiceRepository.save(service);
        });
    }

    private void seedLabTests() {
        LAB_TESTS.forEach(seed -> {
            if (labTestRepository.existsByTestCodeIgnoreCase(seed.code())) {
                return;
            }
            LabTest test = new LabTest();
            test.setTestCode(seed.code());
            test.setTestName(seed.name());
            test.setDescription(seed.description());
            test.setPrice(new BigDecimal(seed.price()));
            test.setStatus("ACTIVE");
            labTestRepository.save(test);
        });
    }

    private void seedMedicines() {
        MEDICINES.forEach(seed -> {
            if (medicineRepository.existsByMedicineCodeIgnoreCase(seed.code())) {
                return;
            }
            Medicine medicine = Medicine.builder()
                    .medicineCode(seed.code())
                    .medicineName(seed.name())
                    .activeIngredient(seed.activeIngredient())
                    .dosageForm(seed.dosageForm())
                    .strength(seed.strength())
                    .unit(seed.unit())
                    .usageInstructions(seed.usageInstructions())
                    .status("ACTIVE")
                    .build();
            medicineRepository.save(medicine);
        });
    }

    private void seedAdmin() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("No initial admin created. Set APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD before first deployment.");
            return;
        }
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role has not been seeded"));
        User admin = new User();
        admin.setFullName(adminFullName);
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setAuthProvider("LOCAL");
        admin.setStatus("ACTIVE");
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);
        log.info("Initial administrator account created for {}", adminEmail);
    }

    private record DepartmentSeed(String name, String description) {
    }

    private record ServiceSeed(String code, String name, String type, String description, String price) {
    }

    private record LabTestSeed(String code, String name, String description, String price) {
    }

    private record MedicineSeed(
            String code,
            String name,
            String activeIngredient,
            String dosageForm,
            String strength,
            String unit,
            String usageInstructions
    ) {
    }
}
