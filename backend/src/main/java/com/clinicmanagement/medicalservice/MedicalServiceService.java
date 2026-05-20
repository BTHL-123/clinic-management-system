package com.clinicmanagement.medicalservice;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.medicalservice.dto.MedicalServiceRequest;
import com.clinicmanagement.medicalservice.dto.MedicalServiceResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicalServiceService {

    private final MedicalServiceRepository medicalServiceRepository;

    @Transactional(readOnly = true)
    public PageResponse<MedicalServiceResponse> getAll(Pageable pageable) {
        Page<MedicalServiceResponse> page = medicalServiceRepository
                .findAll(pageable)
                .map(MedicalServiceResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public List<MedicalServiceResponse> getAllActive() {
        return medicalServiceRepository
                .findAllByStatusOrderByServiceNameAsc("ACTIVE")
                .stream()
                .map(MedicalServiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicalServiceResponse getById(Long id) {
        return MedicalServiceResponse.from(findOrThrow(id));
    }

    @Transactional
    public MedicalServiceResponse create(MedicalServiceRequest request) {
        if (medicalServiceRepository.existsByServiceCodeIgnoreCase(request.serviceCode())) {
            throw new BusinessException("Mã dịch vụ '" + request.serviceCode() + "' đã tồn tại.");
        }

        MedicalService entity = new MedicalService();
        applyRequest(entity, request);
        return MedicalServiceResponse.from(medicalServiceRepository.save(entity));
    }

    @Transactional
    public MedicalServiceResponse update(Long id, MedicalServiceRequest request) {
        MedicalService entity = findOrThrow(id);

        if (medicalServiceRepository.existsByServiceCodeIgnoreCaseAndServiceIdNot(
                request.serviceCode(), id)) {
            throw new BusinessException("Mã dịch vụ '" + request.serviceCode() + "' đã tồn tại.");
        }

        applyRequest(entity, request);
        return MedicalServiceResponse.from(medicalServiceRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        MedicalService entity = findOrThrow(id);
        medicalServiceRepository.delete(entity);
    }

    private MedicalService findOrThrow(Long id) {
        return medicalServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy dịch vụ y tế với ID: " + id));
    }

    private void applyRequest(MedicalService entity, MedicalServiceRequest request) {
        entity.setServiceCode(request.serviceCode().trim().toUpperCase());
        entity.setServiceName(request.serviceName().trim());
        if (request.serviceType() != null) {
            entity.setServiceType(request.serviceType());
        }
        entity.setPrice(request.price());
        entity.setDescription(request.description());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
    }
}
