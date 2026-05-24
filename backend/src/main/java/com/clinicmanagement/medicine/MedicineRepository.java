package com.clinicmanagement.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    boolean existsByMedicineCodeIgnoreCase(String medicineCode);

    boolean existsByMedicineCodeIgnoreCaseAndMedicineIdNot(String medicineCode, Long medicineId);

    @Query("""
            SELECT m FROM Medicine m
            WHERE (:status IS NULL OR m.status = :status)
              AND (:keyword IS NULL OR LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(m.activeIngredient) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Medicine> findByFilters(
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
