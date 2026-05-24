package com.clinicmanagement.lab;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {

    boolean existsByTestCodeIgnoreCase(String testCode);

    boolean existsByTestCodeIgnoreCaseAndLabTestIdNot(String testCode, Long labTestId);

    // Lọc theo status và keyword (tên hoặc mã xét nghiệm)
    @Query("""
            SELECT t FROM LabTest t
            WHERE (:status  IS NULL OR t.status = :status)
              AND (:keyword IS NULL OR LOWER(t.testName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(t.testCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<LabTest> findByFilters(
            @Param("status")  String status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    List<LabTest> findByStatus(String status);
}
