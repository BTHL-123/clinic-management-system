package com.clinicmanagement.doctorleave;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface DoctorLeaveRequestRepository extends JpaRepository<DoctorLeaveRequest, Long> {

    List<DoctorLeaveRequest> findByDoctor_DoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<DoctorLeaveRequest> findByStatusOrderByCreatedAtDesc(DoctorLeaveRequest.LeaveStatus status);

    List<DoctorLeaveRequest> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(r) > 0 FROM DoctorLeaveRequest r
            WHERE r.doctor.doctorId = :doctorId
              AND r.leaveDate = :leaveDate
              AND r.status IN ('PENDING', 'APPROVED')
              AND r.startTime < :endTime
              AND r.endTime > :startTime
            """)
    boolean existsOverlappingRequest(
            @org.springframework.data.repository.query.Param("doctorId") Long doctorId,
            @org.springframework.data.repository.query.Param("leaveDate") LocalDate leaveDate,
            @org.springframework.data.repository.query.Param("startTime") LocalTime startTime,
            @org.springframework.data.repository.query.Param("endTime") LocalTime endTime
    );
}
