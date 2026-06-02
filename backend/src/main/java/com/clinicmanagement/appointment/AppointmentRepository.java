package com.clinicmanagement.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:patientId IS NULL OR a.patient.patientId = :patientId) AND " +
           "(:doctorId IS NULL OR a.doctor.doctorId = :doctorId) AND " +
           "(:date IS NULL OR a.appointmentDate = :date) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Appointment> findAppointmentsFiltered(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN a.patient p " +
           "LEFT JOIN p.user pu " +
           "LEFT JOIN a.doctor d " +
           "LEFT JOIN d.user du " +
           "WHERE (pu.userId = :userId OR du.userId = :userId) AND " +
           "((:upcoming = true AND a.appointmentDate >= :currentDate) OR " +
           " (:upcoming = false AND a.appointmentDate < :currentDate))")
    Page<Appointment> findMyAppointments(
            @Param("userId") Long userId,
            @Param("upcoming") boolean upcoming,
            @Param("currentDate") LocalDate currentDate,
            Pageable pageable
    );

    /**
     * Check if a CONFIRMED/CHECKED_IN appointment already exists for the same
     * doctor, date, and exact time slot — prevents double-booking on walk-in.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE " +
           "a.doctor.doctorId = :doctorId AND " +
           "a.appointmentDate = :date AND " +
           "a.startTime = :startTime AND " +
           "a.endTime = :endTime AND " +
           "a.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED')")
    boolean existsActiveAppointmentForSlot(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    /**
     * Count appointments for a doctor on a given date to help with queue management.
     */
    @Query("SELECT COUNT(a) FROM Appointment a WHERE " +
           "a.doctor.doctorId = :doctorId AND " +
           "a.appointmentDate = :date AND " +
           "a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    long countByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date
    );

    @Query("SELECT a FROM Appointment a WHERE a.doctor.doctorId = :doctorId AND a.appointmentDate = :date ORDER BY a.startTime ASC")
    java.util.List<Appointment> findDoctorTodayAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date
    );
}
