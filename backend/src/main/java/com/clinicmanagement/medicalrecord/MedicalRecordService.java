package com.clinicmanagement.medicalrecord;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
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

    // ── GET LIST ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordResponse> getAll(Long patientId, Long doctorId, Pageable pageable) {
        return PageResponse.from(
                medicalRecordRepository.findByFilters(patientId, doctorId, pageable)
                        .map(MedicalRecordResponse::from)
        );
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MedicalRecordResponse getById(Long id) {
        return MedicalRecordResponse.from(findOrThrow(id));
    }

    // ── GET PATIENT MEDICAL HISTORY ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getMedicalHistory(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(MedicalRecordResponse::from)
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

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
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

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private MedicalRecord findOrThrow(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ bệnh án với ID: " + id));
    }
}
