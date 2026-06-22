package com.clinicmanagement.medicalrecord;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.labrequest.LabRequestRepository;
import com.clinicmanagement.medicalrecord.dto.CreateMedicalRecordRequest;
import com.clinicmanagement.medicalrecord.dto.MedicalRecordResponse;
import com.clinicmanagement.medicalrecord.dto.UpdateMedicalRecordRequest;
import com.clinicmanagement.prescription.PrescriptionRepository;
// Dùng đúng Entity ConsultationSession của anh Bình dặn
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final LabRequestRepository labRequestRepository;
    private final ConsultationSessionRepository consultationSessionRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicalRecordResponse> getAll(Long patientId, Long doctorId, Pageable pageable) {
        return PageResponse.from(
                medicalRecordRepository.findByFilters(patientId, doctorId, pageable)
                        .map(this::toEnrichedResponse)
        );
    }

    @Transactional(readOnly = true)
    @Override
    public MedicalRecordResponse getById(Long id) {
        return toEnrichedResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    @Override
    public List<MedicalRecordResponse> getMedicalHistory(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toEnrichedResponse).toList();
    }

    @Transactional
    @Override
    public MedicalRecordResponse create(CreateMedicalRecordRequest request) {
        if (medicalRecordRepository.existsByConsultationId(request.consultationId())) {
            throw new BusinessException("Hồ sơ bệnh án cho phiên khám này đã tồn tại.");
        }

        // Gọi đúng Entity và check chéo ID
        ConsultationSession consultation = consultationSessionRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh với ID: " + request.consultationId()));

        if (!consultation.getPatientId().equals(request.patientId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Patient ID không khớp!");
        }
        if (!consultation.getDoctorId().equals(request.doctorId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Doctor ID không khớp!");
        }

        MedicalRecord record = MedicalRecord.builder()
                .consultationId(consultation.getConsultationId()) // Dùng getConsultationId()
                .patientId(consultation.getPatientId())
                .doctorId(consultation.getDoctorId())
                .symptoms(request.symptoms())
                .clinicalFindings(request.clinicalFindings())
                .diagnosis(request.diagnosis())
                .treatmentPlan(request.treatmentPlan())
                .doctorNote(request.doctorNote())
                .followUpDate(request.followUpDate())
                .followUpNote(request.followUpNote())
                .build();

        return toEnrichedResponse(medicalRecordRepository.save(record));
    }

    @Transactional
    @Override
    public MedicalRecordResponse update(Long id, UpdateMedicalRecordRequest request) {
        MedicalRecord record = findOrThrow(id);

        if (request.symptoms()         != null) record.setSymptoms(request.symptoms());
        if (request.clinicalFindings() != null) record.setClinicalFindings(request.clinicalFindings());
        if (request.diagnosis()        != null) record.setDiagnosis(request.diagnosis());
        if (request.treatmentPlan()    != null) record.setTreatmentPlan(request.treatmentPlan());
        if (request.doctorNote()       != null) record.setDoctorNote(request.doctorNote());
        if (request.followUpDate()     != null) record.setFollowUpDate(request.followUpDate());
        if (request.followUpNote()     != null) record.setFollowUpNote(request.followUpNote());

        return toEnrichedResponse(medicalRecordRepository.save(record));
    }

    private MedicalRecord findOrThrow(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án với ID: " + id));
    }

    private MedicalRecordResponse toEnrichedResponse(MedicalRecord record) {
        String doctorName = null;
        String departmentName = null;

        if (record.getDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(record.getDoctorId()).orElse(null);
            if (doctor != null) {
                doctorName = doctor.getUser() != null ? doctor.getUser().getFullName() : null;
                departmentName = doctor.getDepartment() != null ? doctor.getDepartment().getDepartmentName() : null;
            }
        }

        boolean hasPrescription = record.getConsultationId() != null
                && prescriptionRepository.existsByConsultationId(record.getConsultationId());
        boolean hasLabResult = record.getConsultationId() != null
                && !labRequestRepository.findByConsultationId(record.getConsultationId()).isEmpty();

        return MedicalRecordResponse.from(record, doctorName, departmentName, hasPrescription, hasLabResult);
    }
}