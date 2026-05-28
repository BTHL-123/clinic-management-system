package com.clinicmanagement.patient;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.patient.dto.PatientProfileUpdateRequest;
import com.clinicmanagement.patient.dto.PatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PatientResponse> getAll(String keyword, Pageable pageable) {
        Page<Patient> page = patientRepository.searchPatients(keyword, pageable);
        return PageResponse.from(page.map(PatientResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + id));
        return PatientResponse.from(patient);
    }

    @Override
    @Transactional
    public PatientResponse create(PatientRequest request) {
        if (patientRepository.existsByPatientCode(request.patientCode())) {
            throw new BusinessException("Mã bệnh nhân đã tồn tại");
        }

        User user = null;
        if (request.userId() != null) {
            if (patientRepository.existsByUser_UserId(request.userId())) {
                throw new BusinessException("Người dùng này đã được liên kết với một hồ sơ bệnh nhân khác");
            }
            user = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.userId()));
        }

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setPatientCode(request.patientCode());
        patient.setFullName(request.fullName());
        patient.setGender(request.gender() != null ? request.gender() : "OTHER");
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setAddress(request.address());
        patient.setIdentityNumber(request.identityNumber());
        patient.setInsuranceNumber(request.insuranceNumber());
        patient.setEmergencyContactName(request.emergencyContactName());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setBloodType(request.bloodType());
        patient.setAllergies(request.allergies());
        patient.setMedicalHistory(request.medicalHistory());

        return PatientResponse.from(patientRepository.save(patient));
    }

    @Override
    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + id));

        if (!patient.getPatientCode().equals(request.patientCode()) && patientRepository.existsByPatientCode(request.patientCode())) {
            throw new BusinessException("Mã bệnh nhân đã tồn tại");
        }

        if (request.userId() != null) {
            if ((patient.getUser() == null || !patient.getUser().getUserId().equals(request.userId())) 
                && patientRepository.existsByUser_UserId(request.userId())) {
                throw new BusinessException("Người dùng này đã được liên kết với một hồ sơ bệnh nhân khác");
            }
            User user = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.userId()));
            patient.setUser(user);
        } else {
            patient.setUser(null);
        }

        patient.setPatientCode(request.patientCode());
        patient.setFullName(request.fullName());
        if (request.gender() != null) {
            patient.setGender(request.gender());
        }
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setAddress(request.address());
        patient.setIdentityNumber(request.identityNumber());
        patient.setInsuranceNumber(request.insuranceNumber());
        patient.setEmergencyContactName(request.emergencyContactName());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setBloodType(request.bloodType());
        patient.setAllergies(request.allergies());
        patient.setMedicalHistory(request.medicalHistory());

        return PatientResponse.from(patientRepository.save(patient));
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getMyProfile(Long userId) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ bệnh nhân nào."));
        return PatientResponse.from(patient);
    }

    @Override
    @Transactional
    public PatientResponse updateMyProfile(Long userId, PatientProfileUpdateRequest request) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ bệnh nhân nào."));

        patient.setFullName(request.fullName());
        if (request.gender() != null) {
            patient.setGender(request.gender());
        }
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setAddress(request.address());
        patient.setIdentityNumber(request.identityNumber());
        patient.setInsuranceNumber(request.insuranceNumber());
        patient.setEmergencyContactName(request.emergencyContactName());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setBloodType(request.bloodType());
        patient.setAllergies(request.allergies());
        patient.setMedicalHistory(request.medicalHistory());

        return PatientResponse.from(patientRepository.save(patient));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + id));
        patientRepository.delete(patient);
    }
}
