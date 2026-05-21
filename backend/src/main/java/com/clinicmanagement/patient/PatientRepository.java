package com.clinicmanagement.patient;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findTopByOrderByPatientIdDesc();
    Optional<Patient> findByUserUserId(Long userId);
    Optional<Patient> findByPhone(String phone);
    Optional<Patient> findByEmail(String email);
}
