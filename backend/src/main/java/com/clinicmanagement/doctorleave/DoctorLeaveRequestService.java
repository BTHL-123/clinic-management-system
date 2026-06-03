package com.clinicmanagement.doctorleave;

import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestCreateRequest;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestResponse;
import com.clinicmanagement.doctorleave.dto.ReviewDoctorLeaveRequest;

import java.util.List;

public interface DoctorLeaveRequestService {

    DoctorLeaveRequestResponse createLeaveRequest(DoctorLeaveRequestCreateRequest request, String currentUserEmail);

    List<DoctorLeaveRequestResponse> getMyLeaveRequests(String currentUserEmail);

    void cancelLeaveRequest(Long id, String currentUserEmail);

    List<DoctorLeaveRequestResponse> getAllLeaveRequests();

    List<DoctorLeaveRequestResponse> getLeaveRequestsByStatus(DoctorLeaveRequest.LeaveStatus status);

    DoctorLeaveRequestResponse approveLeaveRequest(Long id, String adminEmail);

    DoctorLeaveRequestResponse rejectLeaveRequest(Long id, ReviewDoctorLeaveRequest request, String adminEmail);
}
