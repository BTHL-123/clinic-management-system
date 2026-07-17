package com.clinicmanagement.medicalservice;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicalservice.dto.MedicalServiceRequest;
import com.clinicmanagement.medicalservice.dto.MedicalServiceResponse;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface MedicalServiceService {

    PageResponse<MedicalServiceResponse> getAll(Pageable pageable);

    List<MedicalServiceResponse> getAllActive();

    MedicalServiceResponse getById(Long id);

    MedicalServiceResponse create(MedicalServiceRequest request);

    MedicalServiceResponse update(Long id, MedicalServiceRequest request);

    void delete(Long id);
}
