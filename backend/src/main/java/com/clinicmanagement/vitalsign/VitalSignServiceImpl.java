package com.clinicmanagement.vitalsign;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
// Đảm bảo import mấy thằng này (Tên package Consultation của nhóm ông có thể hơi khác, ông dùng IDE Alt+Enter để tự import cho chuẩn nhé)
import com.clinicmanagement.consultation.Consultation;
import com.clinicmanagement.consultation.ConsultationRepository;
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
    // Bổ sung thêm Repository của Consultation để gọi xuống DB
    private final ConsultationRepository consultationRepository;

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

        // 1. Kiểm tra Consultation có tồn tại không
        Consultation consultation = consultationRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh (Consultation) với ID: " + request.consultationId()));

        // 2. Kiểm tra chéo: PatientId từ Frontend gửi lên CÓ KHỚP với PatientId của Consultation trong DB không
        if (!consultation.getPatientId().equals(request.patientId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Patient ID không khớp với thông tin khám bệnh!");
        }

        // (Ghi chú: Vì CreateVitalSignRequest của ông không có truyền doctorId, nên ở Vital Sign mình chỉ check patientId là đủ uy tín rồi)

        // 3. Vượt qua vòng gửi xe rồi thì mới tạo VitalSign.
        // Lấy thông tin patientId và consultationId TỪ DB (thằng consultation) ra gán cho chắc cú, không thèm dùng của request nữa!
        VitalSign vitalSign = VitalSign.builder()
                .consultationId(consultation.getId()) // Hoặc consultation.getConsultationId() tùy cách nhóm ông đặt tên
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