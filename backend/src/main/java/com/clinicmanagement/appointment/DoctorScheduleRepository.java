package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    @Query("SELECT ds FROM DoctorSchedule ds WHERE ds.doctorId = :doctorId AND ds.workDate = :workDate AND ds.status <> 'CANCELLED'")
    List<DoctorSchedule> findActiveSchedulesByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("workDate") LocalDate workDate);

    @Query("SELECT ds FROM DoctorSchedule ds WHERE ds.doctorId = :doctorId AND ds.workDate = :workDate AND ds.id <> :excludeId AND ds.status <> 'CANCELLED'")
    List<DoctorSchedule> findActiveSchedulesByDoctorAndDateExcluding(@Param("doctorId") Long doctorId, @Param("workDate") LocalDate workDate, @Param("excludeId") Long excludeId);

    List<DoctorSchedule> findByDoctorId(Long doctorId, Sort sort);

    List<DoctorSchedule> findByStatus(String status, Sort sort);

    List<DoctorSchedule> findByDoctorIdAndStatus(Long doctorId, String status, Sort sort);

    List<DoctorSchedule> findByWorkDateBetween(LocalDate fromDate, LocalDate toDate, Sort sort);

    List<DoctorSchedule> findByWorkDateBetweenAndStatus(LocalDate fromDate, LocalDate toDate, String status, Sort sort);

    List<DoctorSchedule> findByDoctorIdAndWorkDateBetween(Long doctorId, LocalDate fromDate, LocalDate toDate, Sort sort);

    List<DoctorSchedule> findByDoctorIdAndWorkDateBetweenAndStatus(
            Long doctorId,
            LocalDate fromDate,
            LocalDate toDate,
            String status,
            Sort sort
    );
}
