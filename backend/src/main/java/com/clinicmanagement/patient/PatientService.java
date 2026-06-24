package com.clinicmanagement.patient;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.patient.dto.PatientProfileUpdateRequest;
import com.clinicmanagement.patient.dto.PatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import org.springframework.data.domain.Pageable;

public interface PatientService {

    PageResponse<PatientResponse> getAll(String keyword, Pageable pageable);

    PatientResponse getById(Long id);

    PatientResponse create(PatientRequest request);

    PatientResponse update(Long id, PatientRequest request);

    PatientResponse getMyProfile(Long userId);

    PatientResponse updateMyProfile(Long userId, PatientProfileUpdateRequest request);

    java.util.List<PatientResponse> getMyProfiles(Long userId);

    PatientResponse createDependentProfile(Long userId, PatientRequest request);

    void delete(Long id);
}
