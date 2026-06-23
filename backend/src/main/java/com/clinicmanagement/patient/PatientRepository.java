package com.clinicmanagement.patient;

import java.time.LocalDate;
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
           "(LOWER(p.fullName) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%') " +
           "OR LOWER(p.patientCode) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%') " +
           "OR LOWER(p.phone) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%'))")
    Page<Patient> searchPatients(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Patient p " +
           "JOIN Appointment a ON a.patient.patientId = p.patientId " +
           "WHERE a.doctor.user.userId = :doctorUserId " +
           "AND ((a.appointmentDate = :currentDate) OR " +
           "     (a.appointmentDate > :currentDate AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED', 'RESCHEDULED'))) " +
           "AND (LOWER(p.fullName) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%') " +
           "     OR LOWER(p.patientCode) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%') " +
           "     OR LOWER(p.phone) LIKE CONCAT('%', LOWER(CAST(:keyword AS string)), '%'))")
    Page<Patient> searchDoctorPatients(
            @Param("keyword") String keyword,
            @Param("doctorUserId") Long doctorUserId,
            @Param("currentDate") LocalDate currentDate,
            Pageable pageable
    );

    boolean existsByPatientCode(String patientCode);
    
    boolean existsByUser_UserId(Long userId);

}
