package com.clinicmanagement.medicalrecord;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicalrecord.dto.CreateMedicalRecordRequest;
import com.clinicmanagement.medicalrecord.dto.MedicalRecordResponse;
import com.clinicmanagement.medicalrecord.dto.UpdateMedicalRecordRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicalRecordService {

    PageResponse<MedicalRecordResponse> getAll(Long patientId, Long doctorId, Pageable pageable);

    MedicalRecordResponse getById(Long id);

    List<MedicalRecordResponse> getMedicalHistory(Long patientId);

    MedicalRecordResponse create(CreateMedicalRecordRequest request);

    MedicalRecordResponse update(Long id, UpdateMedicalRecordRequest request);
}
