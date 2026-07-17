package com.clinicmanagement.prescription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByConsultationId(Long consultationId);

    boolean existsByConsultationId(Long consultationId);

    @Query("SELECT p FROM Prescription p WHERE " +
           "(:status IS NULL OR p.status = :status)")
    Page<Prescription> findByStatusFilter(@Param("status") String status, Pageable pageable);
}
