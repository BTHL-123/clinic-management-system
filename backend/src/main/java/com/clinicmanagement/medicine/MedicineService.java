package com.clinicmanagement.medicine;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicine.dto.MedicineRequest;
import com.clinicmanagement.medicine.dto.MedicineResponse;
import java.util.ArrayList;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface MedicineService {

    PageResponse<MedicineResponse> getAll(String status, String keyword, Pageable pageable);

    MedicineResponse getById(Long id);

    MedicineResponse create(MedicineRequest request);

    MedicineResponse update(Long id, MedicineRequest request);

    void delete(Long id);
}
