package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long>, JpaSpecificationExecutor<QueueTicket> {

    Optional<QueueTicket> findByAppointment(Appointment appointment);

    // Lấy hàng đợi theo bác sĩ + ngày + status (optional)
    @Query("""
            SELECT q FROM QueueTicket q
            WHERE q.doctor.doctorId = :doctorId
              AND q.queueDate = :date
              AND (:status IS NULL OR q.status = :status)
            ORDER BY q.queueNumber ASC
            """)
    List<QueueTicket> findByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("status") String status
    );

    @Query("""
            SELECT COALESCE(MAX(q.queueNumber), 0)
            FROM QueueTicket q
            WHERE q.doctor.doctorId = :doctorId AND q.queueDate = :queueDate
            """)
    int findMaxQueueNumberByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("queueDate") LocalDate queueDate
    );
}
