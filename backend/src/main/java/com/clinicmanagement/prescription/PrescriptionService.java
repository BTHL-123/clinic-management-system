package com.clinicmanagement.prescription;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    @Transactional(readOnly = true)
    public PrescriptionResponse getByConsultationId(Long consultationId) {
        Prescription prescription = prescriptionRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn thuốc cho ca khám #" + consultationId));
        return PrescriptionResponse.from(prescription);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn thuốc #" + prescriptionId));
        return PrescriptionResponse.from(prescription);
    }

    public boolean existsByConsultationId(Long consultationId) {
        return prescriptionRepository.existsByConsultationId(consultationId);
    }
}
