package com.clinicmanagement.consultation;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.consultation.dto.ChangeConsultationStatusRequest;
import com.clinicmanagement.consultation.dto.ConsultationResponse;
import com.clinicmanagement.consultation.dto.CreateConsultationRequest;
import org.springframework.data.domain.Pageable;

public interface ConsultationService {

    PageResponse<ConsultationResponse> getAll(Long patientId, Long doctorId, String status, Pageable pageable);

    ConsultationResponse getById(Long id);

    ConsultationResponse create(CreateConsultationRequest request);

    ConsultationResponse start(Long id);

    ConsultationResponse complete(Long id);

    ConsultationResponse changeStatus(Long id, ChangeConsultationStatusRequest request);
}
