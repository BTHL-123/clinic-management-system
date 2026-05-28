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
public class MedicalServiceServiceImpl implements MedicalServiceService {

    private final MedicalServiceRepository medicalServiceRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicalServiceResponse> getAll(Pageable pageable) {
        Page<MedicalServiceResponse> page = medicalServiceRepository
                .findAll(pageable)
                .map(MedicalServiceResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    @Override
    public List<MedicalServiceResponse> getAllActive() {
        return medicalServiceRepository
                .findAllByStatusOrderByServiceNameAsc("ACTIVE")
                .stream()
                .map(MedicalServiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public MedicalServiceResponse getById(Long id) {
        return MedicalServiceResponse.from(findOrThrow(id));
    }

    @Transactional
    @Override
    public MedicalServiceResponse create(MedicalServiceRequest request) {
        if (medicalServiceRepository.existsByServiceCodeIgnoreCase(request.serviceCode())) {
            throw new BusinessException("Mã dịch vụ '" + request.serviceCode() + "' đã tồn tại.");
        }
        if (medicalServiceRepository.existsByServiceNameIgnoreCase(request.serviceName())) {
            throw new BusinessException("Tên dịch vụ '" + request.serviceName() + "' đã tồn tại.");
        }

        MedicalService service = new MedicalService();
        applyRequest(service, request);
        return MedicalServiceResponse.from(medicalServiceRepository.save(service));
    }

    @Transactional
    @Override
    public MedicalServiceResponse update(Long id, MedicalServiceRequest request) {
        MedicalService service = findOrThrow(id);

        if (medicalServiceRepository.existsByServiceCodeIgnoreCaseAndServiceIdNot(request.serviceCode(), id)) {
            throw new BusinessException("Mã dịch vụ '" + request.serviceCode() + "' đã tồn tại.");
        }
        if (medicalServiceRepository.existsByServiceNameIgnoreCaseAndServiceIdNot(request.serviceName(), id)) {
            throw new BusinessException("Tên dịch vụ '" + request.serviceName() + "' đã tồn tại.");
        }

        applyRequest(service, request);
        return MedicalServiceResponse.from(medicalServiceRepository.save(service));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        MedicalService service = findOrThrow(id);
        service.setStatus("INACTIVE");
        medicalServiceRepository.save(service);
    }

    private MedicalService findOrThrow(Long id) {
        return medicalServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy dịch vụ y tế với ID: " + id));
    }

    private void applyRequest(MedicalService service, MedicalServiceRequest request) {
        service.setServiceCode(request.serviceCode().trim().toUpperCase());
        service.setServiceName(request.serviceName().trim());
        service.setServiceType(request.serviceType());
        service.setPrice(request.price());
        service.setDescription(request.description());
        if (request.status() != null) {
            service.setStatus(request.status());
        }
    }
}

