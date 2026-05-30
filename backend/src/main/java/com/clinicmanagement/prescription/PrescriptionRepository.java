package com.clinicmanagement.prescription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByConsultationId(Long consultationId);

    boolean existsByConsultationId(Long consultationId);
}
