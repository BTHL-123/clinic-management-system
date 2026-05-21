package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    @Query("SELECT ds FROM DoctorSchedule ds WHERE ds.doctorId = :doctorId AND ds.workDate = :workDate AND ds.status <> 'CANCELLED'")
    List<DoctorSchedule> findActiveSchedulesByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("workDate") LocalDate workDate);

    @Query("SELECT ds FROM DoctorSchedule ds WHERE ds.doctorId = :doctorId AND ds.workDate = :workDate AND ds.id <> :excludeId AND ds.status <> 'CANCELLED'")
    List<DoctorSchedule> findActiveSchedulesByDoctorAndDateExcluding(@Param("doctorId") Long doctorId, @Param("workDate") LocalDate workDate, @Param("excludeId") Long excludeId);

    @Query("SELECT ds FROM DoctorSchedule ds WHERE " +
           "(:doctorId IS NULL OR ds.doctorId = :doctorId) AND " +
           "(:fromDate IS NULL OR ds.workDate >= :fromDate) AND " +
           "(:toDate IS NULL OR ds.workDate <= :toDate) AND " +
           "(:status IS NULL OR ds.status = :status) " +
           "ORDER BY ds.workDate ASC, ds.startTime ASC")
    List<DoctorSchedule> findAllSchedules(
            @Param("doctorId") Long doctorId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("status") String status
    );
}
