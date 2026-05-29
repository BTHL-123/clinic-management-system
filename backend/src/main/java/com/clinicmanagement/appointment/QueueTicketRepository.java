package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    /**
     * Get the max queue number for a specific doctor on a specific date.
     * Used to generate the next sequential queue number per doctor per day.
     */
    @Query("SELECT COALESCE(MAX(qt.queueNumber), 0) FROM QueueTicket qt " +
           "WHERE qt.doctor.doctorId = :doctorId AND qt.queueDate = :queueDate")
    int findMaxQueueNumberByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("queueDate") LocalDate queueDate
    );
    java.util.Optional<QueueTicket> findByAppointment(Appointment appointment);
}
