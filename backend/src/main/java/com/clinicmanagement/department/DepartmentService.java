package com.clinicmanagement.department;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.department.dto.DepartmentRequest;
import com.clinicmanagement.department.dto.DepartmentResponse;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface DepartmentService {

    PageResponse<DepartmentResponse> getAll(Pageable pageable);

    List<DepartmentResponse> getAllActive();

    DepartmentResponse getById(Long id);

    DepartmentResponse create(DepartmentRequest request);

    DepartmentResponse update(Long id, DepartmentRequest request);

    void delete(Long id);
}
