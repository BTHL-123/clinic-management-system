package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.doctorSchedule.id = :scheduleId ORDER BY ts.startTime ASC")
    List<TimeSlot> findByScheduleId(@Param("scheduleId") Long scheduleId);

    @Query("SELECT COUNT(ts) > 0 FROM TimeSlot ts WHERE ts.doctorSchedule.id = :scheduleId AND ts.status = :status")
    boolean existsByScheduleIdAndStatus(@Param("scheduleId") Long scheduleId, @Param("status") String status);
}
