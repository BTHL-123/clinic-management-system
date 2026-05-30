package com.clinicmanagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    @Query("SELECT b FROM MedicineBatch b WHERE " +
           "(:medicineId IS NULL OR b.medicine.medicineId = :medicineId) " +
           "AND (COALESCE(:status, '') = '' OR b.status = :status)")
    Page<MedicineBatch> findBatches(@Param("medicineId") Long medicineId, @Param("status") String status, Pageable pageable);

    List<MedicineBatch> findByMedicineMedicineIdAndStatus(Long medicineId, String status);
}
