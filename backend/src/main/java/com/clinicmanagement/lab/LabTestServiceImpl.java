package com.clinicmanagement.lab;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.lab.dto.LabTestRequest;
import com.clinicmanagement.lab.dto.LabTestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LabTestServiceImpl implements LabTestService {

    private final LabTestRepository labTestRepository;

    // ── GET LIST ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @Override
    public PageResponse<LabTestResponse> getAll(String status, String keyword, Pageable pageable) {
        return PageResponse.from(
                labTestRepository.findByFilters(status, keyword, pageable)
                        .map(LabTestResponse::from)
        );
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @Override
    public LabTestResponse getById(Long id) {
        return LabTestResponse.from(findOrThrow(id));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public LabTestResponse create(LabTestRequest request) {
        if (labTestRepository.existsByTestCodeIgnoreCase(request.testCode())) {
            throw new BusinessException("Mã xét nghiệm '" + request.testCode() + "' đã tồn tại.");
        }

        LabTest labTest = LabTest.builder()
                .testCode(request.testCode().trim().toUpperCase())
                .testName(request.testName().trim())
                .description(request.description())
                .price(request.price())
                .status(request.status() != null ? request.status() : "ACTIVE")
                .build();

        return LabTestResponse.from(labTestRepository.save(labTest));
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public LabTestResponse update(Long id, LabTestRequest request) {
        LabTest labTest = findOrThrow(id);

        if (labTestRepository.existsByTestCodeIgnoreCaseAndLabTestIdNot(request.testCode(), id)) {
            throw new BusinessException("Mã xét nghiệm '" + request.testCode() + "' đã tồn tại.");
        }

        labTest.setTestCode(request.testCode().trim().toUpperCase());
        labTest.setTestName(request.testName().trim());
        labTest.setDescription(request.description());
        labTest.setPrice(request.price());
        if (request.status() != null) labTest.setStatus(request.status());

        return LabTestResponse.from(labTestRepository.save(labTest));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public void delete(Long id) {
        if (!labTestRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy xét nghiệm với ID: " + id);
        }
        labTestRepository.deleteById(id);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    LabTest findOrThrow(Long id) {
        return labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy xét nghiệm với ID: " + id));
    }
}

