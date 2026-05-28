package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.lab.LabTest;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;
    private final LabTestRepository labTestRepository;

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
        // Sinh mã phiếu: LR-YYYYMMDD-{count+1}
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

        // Thêm từng loại xét nghiệm vào items
        for (Long labTestId : request.labTestIds()) {
            LabTest labTest = labTestRepository.findById(labTestId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy loại xét nghiệm #" + labTestId));

            LabRequestItem item = LabRequestItem.builder()
                    .labRequest(labRequest)
                    .labTest(labTest)
                    .status("REQUESTED")
                    .build();

            labRequest.getItems().add(item);
        }

        return LabRequestResponse.from(labRequestRepository.save(labRequest));
    }

    // ── CHECK HAS LAB RESULT ──────────────────────────────────────────────────
    public boolean hasLabResultByConsultationId(Long consultationId) {
        return labRequestRepository.existsCompletedResultByConsultationId(consultationId);
    }
}
