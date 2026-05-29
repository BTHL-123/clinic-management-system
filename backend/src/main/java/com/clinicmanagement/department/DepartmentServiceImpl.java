package com.clinicmanagement.department;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.dto.DepartmentRequest;
import com.clinicmanagement.department.dto.DepartmentResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DepartmentResponse> getAll(Pageable pageable) {
        Page<DepartmentResponse> page = departmentRepository
                .findAll(pageable)
                .map(DepartmentResponse::from);
        return PageResponse.from(page);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllActive() {
        return departmentRepository
                .findAllByStatusOrderByDepartmentNameAsc("ACTIVE")
                .stream()
                .map(DepartmentResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getById(Long id) {
        return DepartmentResponse.from(findOrThrow(id));
    }

    @Override
    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByDepartmentNameIgnoreCase(request.departmentName())) {
            throw new BusinessException("Tên chuyên khoa '" + request.departmentName() + "' đã tồn tại.");
        }

        Department dept = new Department();
        applyRequest(dept, request);
        return DepartmentResponse.from(departmentRepository.save(dept));
    }

    @Override
    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department dept = findOrThrow(id);

        if (departmentRepository.existsByDepartmentNameIgnoreCaseAndDepartmentIdNot(
                request.departmentName(), id)) {
            throw new BusinessException("Tên chuyên khoa '" + request.departmentName() + "' đã tồn tại.");
        }

        applyRequest(dept, request);
        return DepartmentResponse.from(departmentRepository.save(dept));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Department dept = findOrThrow(id);
        departmentRepository.delete(dept);
    }

    private Department findOrThrow(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy chuyên khoa với ID: " + id));
    }

    private void applyRequest(Department dept, DepartmentRequest request) {
        dept.setDepartmentName(request.departmentName().trim());
        dept.setDescription(request.description());
        if (request.status() != null) {
            dept.setStatus(request.status());
        }
    }
}
