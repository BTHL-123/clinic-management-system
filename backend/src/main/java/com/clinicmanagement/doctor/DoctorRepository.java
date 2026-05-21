package com.clinicmanagement.doctor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE " +
            "(:departmentId IS NULL OR d.department.departmentId = :departmentId) AND " +
            "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
            "OR LOWER(d.doctorCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) AND " +
            "(:status IS NULL OR d.status = :status)")
    Page<Doctor> searchDoctors(@Param("departmentId") Long departmentId,
                               @Param("keyword") String keyword,
                               @Param("status") String status,
                               Pageable pageable);

    boolean existsByDoctorCode(String doctorCode);
    
    java.util.Optional<Doctor> findByUser_UserId(Long userId);
    
    boolean existsByUser_UserId(Long userId);
}
