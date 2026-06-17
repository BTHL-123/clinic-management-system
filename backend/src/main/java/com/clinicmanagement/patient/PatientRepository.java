package com.clinicmanagement.patient;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findTopByPhone(String phone);
    Optional<Patient> findTopByOrderByPatientIdDesc();

    java.util.List<Patient> findListByUserUserId(Long userId);
    Optional<Patient> findByUserUserId(Long userId);

    Optional<Patient> findByUser_UserId(Long userId);

    @Query("SELECT p FROM Patient p WHERE " +
           "(LOWER(p.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "OR LOWER(p.phone) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))")
    Page<Patient> searchPatients(@Param("keyword") String keyword, Pageable pageable);

    boolean existsByPatientCode(String patientCode);
    
    boolean existsByUser_UserId(Long userId);

}
