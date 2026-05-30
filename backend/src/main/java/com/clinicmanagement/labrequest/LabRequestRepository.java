package com.clinicmanagement.labrequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabRequestRepository extends JpaRepository<LabRequest, Long> {

    List<LabRequest> findByConsultationId(Long consultationId);

    @Query("""
            SELECT lr FROM LabRequest lr
            WHERE (:status IS NULL OR lr.status = :status)
            ORDER BY lr.requestedAt DESC
            """)
    Page<LabRequest> findByStatus(@Param("status") String status, Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(lr) > 0 THEN true ELSE false END
            FROM LabRequest lr
            JOIN lr.items item
            JOIN item.labResult res
            WHERE lr.consultationId = :consultationId
            """)
    boolean existsCompletedResultByConsultationId(@Param("consultationId") Long consultationId);
}