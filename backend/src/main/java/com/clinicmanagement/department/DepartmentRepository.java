package com.clinicmanagement.department;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    boolean existsByDepartmentNameIgnoreCase(String departmentName);

    boolean existsByDepartmentNameIgnoreCaseAndDepartmentIdNot(String departmentName, Long departmentId);

    List<Department> findAllByStatusOrderByDepartmentNameAsc(String status);
}
