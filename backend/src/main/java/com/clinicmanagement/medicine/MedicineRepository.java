package com.clinicmanagement.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    boolean existsByMedicineCode(String medicineCode);

    @Query("SELECT m FROM Medicine m WHERE " +
           "(COALESCE(:keyword, '') = '' OR LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (COALESCE(:status, '') = '' OR m.status = :status)")
    Page<Medicine> searchMedicines(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);
}
