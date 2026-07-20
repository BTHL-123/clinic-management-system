package com.clinicmanagement.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.medicalservice.MedicalServiceRepository;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
        "app.seed.enabled=true",
        "app.seed.admin-email=admin.seed.test@example.com",
        "app.seed.admin-password=strong-test-password"
})
@ActiveProfiles("test")
class DataSeederIntegrationTest {

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private MedicalServiceRepository medicalServiceRepository;

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void seedsOnlyBaselineCatalogAndInitialAdministrator() throws Exception {
        assertEquals(7, departmentRepository.count());
        assertEquals(6, medicalServiceRepository.count());
        assertEquals(5, labTestRepository.count());
        assertEquals(10, medicineRepository.count());
        assertTrue(roleRepository.existsByRoleName("ADMIN"));
        assertTrue(userRepository.existsByEmail("admin.seed.test@example.com"));

        dataSeeder.run();

        assertEquals(7, departmentRepository.count());
        assertEquals(6, medicalServiceRepository.count());
        assertEquals(5, labTestRepository.count());
        assertEquals(10, medicineRepository.count());
        assertEquals(1, userRepository.count());
    }
}
