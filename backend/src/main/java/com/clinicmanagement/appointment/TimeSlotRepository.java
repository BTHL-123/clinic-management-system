package com.clinicmanagement.appointment;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.doctorSchedule.id = :scheduleId ORDER BY ts.startTime ASC")
    List<TimeSlot> findByScheduleId(@Param("scheduleId") Long scheduleId);

    @Query("SELECT COUNT(ts) > 0 FROM TimeSlot ts WHERE ts.doctorSchedule.id = :scheduleId AND ts.status = :status")
    boolean existsByScheduleIdAndStatus(@Param("scheduleId") Long scheduleId, @Param("status") String status);

    List<TimeSlot> findByDoctorScheduleId(Long scheduleId);

    @Modifying
    @Query("DELETE FROM TimeSlot ts WHERE ts.doctorSchedule.id = :scheduleId")
    void deleteAllByScheduleId(@Param("scheduleId") Long scheduleId);

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.doctorSchedule.doctorId = :doctorId AND ts.doctorSchedule.workDate = :workDate ORDER BY ts.startTime ASC")
    List<TimeSlot> findAllSlotsByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("workDate") LocalDate workDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ts FROM TimeSlot ts WHERE ts.id = :id")
    Optional<TimeSlot> findByIdWithPessimisticLock(@Param("id") Long id);

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.status = 'LOCKED' AND ts.lockedUntil < :now")
    List<TimeSlot> findExpiredLocks(@Param("now") LocalDateTime now);

    @Query("SELECT ts FROM TimeSlot ts JOIN ts.doctorSchedule ds " +
           "WHERE ts.status IN ('AVAILABLE', 'LOCKED') " +
           "AND (ds.workDate < :today OR (ds.workDate = :today AND ts.startTime <= :currentTime)) " +
           "AND NOT EXISTS (SELECT a.appointmentId FROM Appointment a WHERE a.timeSlot = ts)")
    List<TimeSlot> findPastUnusedSlots(
            @Param("today") LocalDate today,
            @Param("currentTime") LocalTime currentTime
    );
}
