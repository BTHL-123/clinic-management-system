package com.clinicmanagement.lab;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.lab.dto.LabTestRequest;
import com.clinicmanagement.lab.dto.LabTestResponse;
import org.springframework.data.domain.Pageable;

public interface LabTestService {

    PageResponse<LabTestResponse> getAll(String status, String keyword, Pageable pageable);

    LabTestResponse getById(Long id);

    LabTestResponse create(LabTestRequest request);

    LabTestResponse update(Long id, LabTestRequest request);

    void delete(Long id);
}
