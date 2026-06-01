package com.clinicmanagement.doctorleave;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface DoctorLeaveRequestRepository extends JpaRepository<DoctorLeaveRequest, Long> {

    List<DoctorLeaveRequest> findByDoctor_DoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<DoctorLeaveRequest> findByStatusOrderByCreatedAtDesc(DoctorLeaveRequest.LeaveStatus status);

    List<DoctorLeaveRequest> findAllByOrderByCreatedAtDesc();

    boolean existsByDoctor_DoctorIdAndLeaveDateAndStartTimeAndEndTimeAndStatus(
            Long doctorId,
            LocalDate leaveDate,
            LocalTime startTime,
            LocalTime endTime,
            DoctorLeaveRequest.LeaveStatus status
    );
}
