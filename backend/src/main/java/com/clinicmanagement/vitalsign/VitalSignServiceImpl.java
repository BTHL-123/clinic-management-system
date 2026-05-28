package com.clinicmanagement.vitalsign;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.vitalsign.dto.CreateVitalSignRequest;
import com.clinicmanagement.vitalsign.dto.VitalSignResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VitalSignServiceImpl implements VitalSignService {

    private final VitalSignRepository vitalSignRepository;

    // ── GET BY CONSULTATION ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @Override
    public List<VitalSignResponse> getByConsultation(Long consultationId) {
        return vitalSignRepository.findByConsultationIdOrderByMeasuredAtDesc(consultationId)
                .stream()
                .map(VitalSignResponse::from)
                .toList();
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public VitalSignResponse create(CreateVitalSignRequest request, Long measuredBy) {
        VitalSign vitalSign = VitalSign.builder()
                .consultationId(request.consultationId())
                .patientId(request.patientId())
                .heightCm(request.heightCm())
                .weightKg(request.weightKg())
                .temperatureC(request.temperatureC())
                .bloodPressureSystolic(request.bloodPressureSystolic())
                .bloodPressureDiastolic(request.bloodPressureDiastolic())
                .heartRate(request.heartRate())
                .respiratoryRate(request.respiratoryRate())
                .spo2(request.spo2())
                .measuredBy(measuredBy)
                .build();

        return VitalSignResponse.from(vitalSignRepository.save(vitalSign));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public void delete(Long id) {
        if (!vitalSignRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chỉ số sinh tồn với ID: " + id);
        }
        vitalSignRepository.deleteById(id);
    }
}

