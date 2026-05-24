package com.clinicmanagement.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

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

    @Query("SELECT a FROM Appointment a WHERE a.patient.user.userId = :userId AND " +
           "((:upcoming = true AND (a.appointmentDate > :currentDate OR (a.appointmentDate = :currentDate AND a.endTime >= :currentTime))) OR " +
           " (:upcoming = false AND (a.appointmentDate < :currentDate OR (a.appointmentDate = :currentDate AND a.endTime < :currentTime))))")
    Page<Appointment> findMyAppointments(
            @Param("userId") Long userId,
            @Param("upcoming") boolean upcoming,
            @Param("currentDate") LocalDate currentDate,
            @Param("currentTime") LocalTime currentTime,
            Pageable pageable
    );
}
