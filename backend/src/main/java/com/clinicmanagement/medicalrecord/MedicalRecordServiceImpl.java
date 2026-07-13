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
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDate;
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
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    private CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return (CustomUserDetails) auth.getPrincipal();
        }
        return null;
    }

    private void validateAccess(Long patientId) {
        CustomUserDetails currentUser = getCurrentUserDetails();
        if (currentUser == null) {
            throw new BusinessException("Không thể xác thực thông tin người dùng.");
        }
        
        boolean isAdminOrReceptionist = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPTIONIST"));
        if (isAdminOrReceptionist) {
            return;
        }

        boolean isDoctor = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
        if (isDoctor) {
            Long userId = currentUser.getUser().getUserId();
            boolean hasAppointment = appointmentRepository.existsAppointmentForDoctorAndPatient(
                    userId, patientId
            );
            if (!hasAppointment) {
                throw new BusinessException("Bạn không có quyền xem bệnh án của bệnh nhân này.");
            }
            return;
        }

        boolean isPatient = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
        if (isPatient) {
            Long userId = currentUser.getUser().getUserId();
            boolean belongsToUser = patientRepository.findById(patientId)
                    .map(p -> p.getUser() != null && p.getUser().getUserId().equals(userId))
                    .orElse(false);
            if (!belongsToUser) {
                throw new BusinessException("Bạn không có quyền truy cập bệnh án của người khác.");
            }
            return;
        }
        
        throw new BusinessException("Bạn không có quyền truy cập bệnh án.");
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicalRecordResponse> getAll(Long patientId, Long doctorId, Pageable pageable) {
        CustomUserDetails currentUser = getCurrentUserDetails();
        if (currentUser != null) {
            boolean isDoctor = currentUser.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
            if (isDoctor) {
                if (patientId != null) {
                    validateAccess(patientId);
                } else {
                    Doctor doctor = doctorRepository.findByUser_UserId(currentUser.getUser().getUserId())
                            .orElseThrow(() -> new BusinessException("Bác sĩ không tồn tại."));
                    if (doctorId == null || !doctorId.equals(doctor.getDoctorId())) {
                        throw new BusinessException("Bạn chỉ được xem hồ sơ bệnh án do chính mình phụ trách.");
                    }
                }
            }
        }

        return PageResponse.from(
                medicalRecordRepository.findByFilters(patientId, doctorId, pageable)
                        .map(this::toEnrichedResponse)
        );
    }

    @Transactional(readOnly = true)
    @Override
    public MedicalRecordResponse getById(Long id) {
        MedicalRecord record = findOrThrow(id);
        validateAccess(record.getPatientId());
        return toEnrichedResponse(record);
    }

    @Transactional(readOnly = true)
    @Override
    public List<MedicalRecordResponse> getMedicalHistory(Long patientId) {
        validateAccess(patientId);
        boolean receptionistOnly = isReceptionistOnly();
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(r -> receptionistOnly ? toCensoredResponse(r) : toEnrichedResponse(r))
                .toList();
    }

    @Transactional
    @Override
    public MedicalRecordResponse create(CreateMedicalRecordRequest request) {
        validateAccess(request.patientId());
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
        validateAccess(record.getPatientId());

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

    private boolean isReceptionistOnly() {
        CustomUserDetails currentUser = getCurrentUserDetails();
        if (currentUser == null) {
            return false;
        }
        boolean isAdminOrDoctor = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_DOCTOR"));
        boolean isReceptionist = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECEPTIONIST"));
        return isReceptionist && !isAdminOrDoctor;
    }

    private MedicalRecordResponse toCensoredResponse(MedicalRecord record) {
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

        return new MedicalRecordResponse(
                record.getMedicalRecordId(),
                record.getConsultationId(),
                record.getPatientId(),
                record.getDoctorId(),
                doctorName,
                departmentName,
                null, // symptoms
                null, // clinicalFindings
                null, // diagnosis
                null, // treatmentPlan
                null, // doctorNote
                null, // followUpDate
                null, // followUpNote
                null, // voiceInputTranscript
                null, // aiSummary
                record.getCreatedAt(),
                record.getUpdatedAt(),
                hasPrescription,
                hasLabResult
        );
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

        CustomUserDetails currentUser = getCurrentUserDetails();
        boolean isReceptionistOnly = false;
        if (currentUser != null) {
            boolean hasReceptionist = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_RECEPTIONIST"));
            boolean hasAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            isReceptionistOnly = hasReceptionist && !hasAdmin;
        }

        if (isReceptionistOnly) {
            return new MedicalRecordResponse(
                    record.getMedicalRecordId(),
                    record.getConsultationId(),
                    record.getPatientId(),
                    record.getDoctorId(),
                    doctorName,
                    departmentName,
                    null, // symptoms
                    null, // clinicalFindings
                    null, // diagnosis
                    null, // treatmentPlan
                    null, // doctorNote
                    record.getFollowUpDate(),
                    null, // followUpNote
                    null, // voiceInputTranscript
                    null, // aiSummary
                    record.getCreatedAt(),
                    record.getUpdatedAt(),
                    hasPrescription,
                    hasLabResult
            );
        }

        return MedicalRecordResponse.from(record, doctorName, departmentName, hasPrescription, hasLabResult);
    }
}