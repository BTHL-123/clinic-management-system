package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.lab.LabTest;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;
    private final LabTestRepository labTestRepository;

    // ── GET ALL (for lab technician) ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<LabRequestResponse> getAll(String status, Pageable pageable) {
        return PageResponse.from(
                labRequestRepository.findByStatus(status, pageable)
                        .map(LabRequestResponse::from)
        );
    }

    // ── GET BY CONSULTATION ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<LabRequestResponse> getByConsultationId(Long consultationId) {
        List<LabRequest> requests = labRequestRepository.findByConsultationId(consultationId);
        if (requests.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Không tìm thấy phiếu xét nghiệm cho ca khám #" + consultationId);
        }
        return requests.stream().map(LabRequestResponse::from).toList();
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public LabRequestResponse getById(Long labRequestId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phiếu xét nghiệm #" + labRequestId));
        return LabRequestResponse.from(request);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    public LabRequestResponse create(CreateLabRequestRequest request) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = labRequestRepository.count();
        String requestCode = "LR-" + date + "-" + String.format("%04d", count + 1);

        LabRequest labRequest = LabRequest.builder()
                .consultationId(request.consultationId())
                .patientId(request.patientId())
                .doctorId(request.doctorId())
                .requestCode(requestCode)
                .note(request.note())
                .status("REQUESTED")
                .build();

        for (Long labTestId : request.labTestIds()) {
            LabTest labTest = labTestRepository.findById(labTestId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy loại xét nghiệm #" + labTestId));
            labRequest.getItems().add(LabRequestItem.builder()
                    .labRequest(labRequest)
                    .labTest(labTest)
                    .status("REQUESTED")
                    .build());
        }

        return LabRequestResponse.from(labRequestRepository.save(labRequest));
    }

    // ── ACCEPT (Task 45 core) ─────────────────────────────────────────────────
    @Transactional
    public LabRequestResponse accept(Long labRequestId, Long acceptedByUserId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phiếu xét nghiệm #" + labRequestId));

        if (!"REQUESTED".equals(request.getStatus())) {
            throw new BusinessException("Chỉ có thể tiếp nhận phiếu ở trạng thái REQUESTED.");
        }

        request.setStatus("IN_PROGRESS");
        request.setAcceptedBy(acceptedByUserId);
        request.setAcceptedAt(LocalDateTime.now());

        // Cập nhật tất cả items sang IN_PROGRESS
        request.getItems().forEach(item -> item.setStatus("IN_PROGRESS"));

        return LabRequestResponse.from(labRequestRepository.save(request));
    }

    // ── CHECK HAS LAB RESULT ──────────────────────────────────────────────────
    public boolean hasLabResultByConsultationId(Long consultationId) {
        return labRequestRepository.existsCompletedResultByConsultationId(consultationId);
    }
}
