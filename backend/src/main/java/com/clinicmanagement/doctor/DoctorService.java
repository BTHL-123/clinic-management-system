package com.clinicmanagement.doctor;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.doctor.dto.DoctorRequest;
import com.clinicmanagement.doctor.dto.DoctorResponse;
import org.springframework.data.domain.Pageable;

public interface DoctorService {

    PageResponse<DoctorResponse> getDoctors(Long departmentId, String keyword, String status, Pageable pageable);

    DoctorResponse getDoctorById(Long id);

    DoctorResponse createDoctor(DoctorRequest request);

    DoctorResponse updateDoctor(Long id, DoctorRequest request);

    DoctorResponse getMyProfile(Long userId);

    void deleteDoctor(Long id);
}
