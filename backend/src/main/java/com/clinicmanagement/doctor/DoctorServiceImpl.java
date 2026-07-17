package com.clinicmanagement.doctor;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.doctor.dto.DoctorRequest;
import com.clinicmanagement.doctor.dto.DoctorResponse;
import com.clinicmanagement.role.Role;
import com.clinicmanagement.role.RoleRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DoctorResponse> getDoctors(Long departmentId, String keyword, String status, Pageable pageable) {
        Page<Doctor> page = doctorRepository.searchDoctors(departmentId, keyword, status, pageable);
        return PageResponse.from(page.map(DoctorResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        return DoctorResponse.from(doctor);
    }

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepository.existsByUser_UserId(request.userId())) {
            throw new BusinessException("User này đã là một bác sĩ");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + request.userId()));
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Chuyên khoa với ID: " + request.departmentId()));

        boolean hasDoctorRole = user.getRoles().stream().anyMatch(r -> r.getRoleName().equals("DOCTOR"));
        if (!hasDoctorRole) {
            Role doctorRole = roleRepository.findByRoleName("DOCTOR")
                    .orElseThrow(() -> new BusinessException("Không tìm thấy quyền DOCTOR trong hệ thống"));
            user.getRoles().add(doctorRole);
        }

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDepartment(department);
        doctor.setDoctorCode("TEMP-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        doctor.setDegree(request.degree());
        doctor.setSpecialization(request.specialization());
        doctor.setYearsOfExperience(request.yearsOfExperience());
        doctor.setYearOfBirth(request.yearOfBirth());
        doctor.setHometown(request.hometown());
        doctor.setBiography(request.biography());
        doctor.setConsultationFee(request.consultationFee());
        doctor.setStatus("ACTIVE");

        doctor = doctorRepository.save(doctor);
        doctor.setDoctorCode("DOC-" + doctor.getDoctorId());
        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));

        if (request.userId() != null && !doctor.getUser().getUserId().equals(request.userId())) {
            if (doctorRepository.existsByUser_UserId(request.userId())) {
                throw new BusinessException("User này đã là một bác sĩ");
            }
            User user = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + request.userId()));
            doctor.setUser(user);
        }

        if (!doctor.getDepartment().getDepartmentId().equals(request.departmentId())) {
            Department department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Chuyên khoa với ID: " + request.departmentId()));
            doctor.setDepartment(department);
        }

        doctor.setDegree(request.degree());
        doctor.setSpecialization(request.specialization());
        doctor.setYearsOfExperience(request.yearsOfExperience());
        doctor.setYearOfBirth(request.yearOfBirth());
        doctor.setHometown(request.hometown());
        doctor.setBiography(request.biography());
        doctor.setConsultationFee(request.consultationFee());
        if (request.status() != null) {
            doctor.setStatus(request.status());
        }

        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getMyProfile(Long userId) {
        Doctor doctor = doctorRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ bác sĩ nào."));
        return DoctorResponse.from(doctor);
    }

    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        doctorRepository.delete(doctor);
    }
}
