package com.clinicmanagement.medicalrecord;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByConsultationId(Long consultationId);

    boolean existsByConsultationId(Long consultationId);

    // Lấy toàn bộ lịch sử bệnh án của 1 bệnh nhân (dùng cho medical history)
    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    // Lọc theo patientId, doctorId (optional)
    @Query("""
            SELECT m FROM MedicalRecord m
            WHERE (:patientId IS NULL OR m.patientId = :patientId)
              AND (:doctorId  IS NULL OR m.doctorId  = :doctorId)
            """)
    Page<MedicalRecord> findByFilters(
            @Param("patientId") Long patientId,
            @Param("doctorId")  Long doctorId,
            Pageable pageable
    );
}
