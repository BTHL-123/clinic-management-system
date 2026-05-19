package com.clinicmanagement.doctor;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public PageResponse<DoctorResponse> getDoctors(Long departmentId, String keyword, String status, Pageable pageable) {
        Page<Doctor> page = doctorRepository.searchDoctors(departmentId, keyword, status, pageable);
        return PageResponse.from(page.map(DoctorResponse::from));
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        return DoctorResponse.from(doctor);
    }

    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepository.existsByDoctorCode(request.doctorCode())) {
            throw new BusinessException("Mã bác sĩ đã tồn tại");
        }
        if (doctorRepository.existsByUser_UserId(request.userId())) {
            throw new BusinessException("User này đã là một bác sĩ");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + request.userId()));
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Chuyên khoa với ID: " + request.departmentId()));

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDepartment(department);
        doctor.setDoctorCode(request.doctorCode());
        doctor.setDegree(request.degree());
        doctor.setSpecialization(request.specialization());
        doctor.setYearsOfExperience(request.yearsOfExperience());
        doctor.setBiography(request.biography());
        doctor.setConsultationFee(request.consultationFee());
        doctor.setStatus("ACTIVE");

        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));

        if (!doctor.getDoctorCode().equals(request.doctorCode()) && doctorRepository.existsByDoctorCode(request.doctorCode())) {
            throw new BusinessException("Mã bác sĩ đã tồn tại");
        }

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

        doctor.setDoctorCode(request.doctorCode());
        doctor.setDegree(request.degree());
        doctor.setSpecialization(request.specialization());
        doctor.setYearsOfExperience(request.yearsOfExperience());
        doctor.setBiography(request.biography());
        doctor.setConsultationFee(request.consultationFee());
        if (request.status() != null) {
            doctor.setStatus(request.status());
        }

        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        doctorRepository.delete(doctor);
    }
}
