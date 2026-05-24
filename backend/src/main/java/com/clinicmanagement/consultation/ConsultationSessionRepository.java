package com.clinicmanagement.consultation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, Long> {

    Optional<ConsultationSession> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    List<ConsultationSession> findByPatientId(Long patientId);

    List<ConsultationSession> findByDoctorId(Long doctorId);

    // Lọc theo patientId, doctorId, status (tất cả optional)
    @Query("""
            SELECT c FROM ConsultationSession c
            WHERE (:patientId IS NULL OR c.patientId = :patientId)
              AND (:doctorId  IS NULL OR c.doctorId  = :doctorId)
              AND (:status    IS NULL OR c.status    = :status)
            """)
    Page<ConsultationSession> findByFilters(
            @Param("patientId") Long patientId,
            @Param("doctorId")  Long doctorId,
            @Param("status")    String status,
            Pageable pageable
    );
}
