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

    /**
     * Find ALL active queue tickets for a patient today.
     * Active = WAITING or CALLED.
     * Returns List to safely handle multiple tickets.
     * Priority selection (CALLED first) is done in QueueServiceImpl.
     */
    @Query("""
            SELECT q FROM QueueTicket q
            WHERE q.patient.patientId = :patientId
              AND q.queueDate = :date
              AND q.status IN ('WAITING', 'CALLED')
            ORDER BY q.queueNumber ASC
            """)
    List<QueueTicket> findActiveTicketsByPatientAndDate(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date
    );

    /**
     * Find the smallest queue number currently being served (CALLED)
     * for a given doctor today. Returns 0 if none is being called.
     */
    @Query("""
            SELECT COALESCE(MIN(q.queueNumber), 0)
            FROM QueueTicket q
            WHERE q.doctor.doctorId = :doctorId
              AND q.queueDate = :date
              AND q.status = 'CALLED'
            """)
    int findCurrentServingNumber(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date
    );

    /**
     * Count patients ahead of the given queue number who are still WAITING or CALLED.
     */
    @Query("""
            SELECT COUNT(q)
            FROM QueueTicket q
            WHERE q.doctor.doctorId = :doctorId
              AND q.queueDate = :date
              AND q.status IN ('WAITING', 'CALLED')
              AND q.queueNumber < :myQueueNumber
            """)
    int countPatientsAhead(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("myQueueNumber") int myQueueNumber
    );
}

