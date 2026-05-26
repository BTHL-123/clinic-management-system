package com.clinicmanagement.medicalrecord;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.medicalrecord.dto.CreateMedicalRecordRequest;
import com.clinicmanagement.medicalrecord.dto.MedicalRecordResponse;
import com.clinicmanagement.medicalrecord.dto.UpdateMedicalRecordRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;

    // ── GET LIST ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordResponse> getAll(Long patientId, Long doctorId, Pageable pageable) {
        return PageResponse.from(
                medicalRecordRepository.findByFilters(patientId, doctorId, pageable)
                        .map(this::toEnrichedResponse)
        );
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MedicalRecordResponse getById(Long id) {
        return toEnrichedResponse(findOrThrow(id));
    }

    // ── GET PATIENT MEDICAL HISTORY ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getMedicalHistory(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toEnrichedResponse)
                .toList();
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    public MedicalRecordResponse create(CreateMedicalRecordRequest request) {
        if (medicalRecordRepository.existsByConsultationId(request.consultationId())) {
            throw new BusinessException("Hồ sơ bệnh án cho phiên khám này đã tồn tại.");
        }

        MedicalRecord record = MedicalRecord.builder()
                .consultationId(request.consultationId())
                .patientId(request.patientId())
                .doctorId(request.doctorId())
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

    // ── UPDATE ────────────────────────────────────────────────────────────────
    @Transactional
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

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private MedicalRecord findOrThrow(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ bệnh án với ID: " + id));
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

        return MedicalRecordResponse.from(record, doctorName, departmentName);
    }
}

