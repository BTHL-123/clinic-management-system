package com.clinicmanagement.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    Page<Review> findByDoctorDoctorId(Long doctorId, Pageable pageable);
    
    boolean existsByAppointmentAppointmentId(Long appointmentId);
}
