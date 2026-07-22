package com.clinicmanagement.prescription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Prescription p WHERE p.prescriptionId = :prescriptionId")
    Optional<Prescription> findByIdForUpdate(@Param("prescriptionId") Long prescriptionId);

    Optional<Prescription> findByConsultationId(Long consultationId);

    boolean existsByConsultationId(Long consultationId);

    @Query("SELECT p FROM Prescription p WHERE " +
           "(:status IS NULL OR p.status = :status)")
    Page<Prescription> findByStatusFilter(@Param("status") String status, Pageable pageable);
}
