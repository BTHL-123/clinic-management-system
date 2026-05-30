package com.clinicmanagement.vitalsign;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
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
    private final ConsultationSessionRepository consultationSessionRepository;

    @Transactional(readOnly = true)
    @Override
    public List<VitalSignResponse> getByConsultation(Long consultationId) {
        return vitalSignRepository.findByConsultationIdOrderByMeasuredAtDesc(consultationId)
                .stream().map(VitalSignResponse::from).toList();
    }

    @Transactional
    @Override
    public VitalSignResponse create(CreateVitalSignRequest request, Long measuredBy) {
        ConsultationSession consultation = consultationSessionRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh với ID: " + request.consultationId()));

        if (!consultation.getPatientId().equals(request.patientId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Patient ID không khớp với thông tin khám bệnh!");
        }

        VitalSign vitalSign = VitalSign.builder()
                .consultationId(consultation.getConsultationId())
                .patientId(consultation.getPatientId())
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

    @Transactional
    @Override
    public void delete(Long id) {
        if (!vitalSignRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chỉ số sinh tồn với ID: " + id);
        }
        vitalSignRepository.deleteById(id);
    }
}