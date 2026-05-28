package com.clinicmanagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    Optional<QueueTicket> findByAppointmentId(Long appointmentId);

    // Lấy hàng đợi theo bác sĩ + ngày + status (optional)
    @Query("""
            SELECT q FROM QueueTicket q
            WHERE q.doctorId = :doctorId
              AND q.queueDate = :date
              AND (:status IS NULL OR q.status = :status)
            ORDER BY q.queueNumber ASC
            """)
    List<QueueTicket> findByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("status") String status
    );

    // Số thứ tự lớn nhất trong ngày của bác sĩ (để tạo số mới)
    @Query("""
            SELECT COALESCE(MAX(q.queueNumber), 0)
            FROM QueueTicket q
            WHERE q.doctorId = :doctorId AND q.queueDate = :date
            """)
    int findMaxQueueNumber(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);
}
