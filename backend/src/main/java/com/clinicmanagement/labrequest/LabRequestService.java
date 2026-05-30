package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.lab.LabTest;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
// Bổ sung import Consultation
import com.clinicmanagement.consultation.Consultation;
import com.clinicmanagement.consultation.ConsultationRepository;
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
    // Bơm thêm gác cổng
    private final ConsultationRepository consultationRepository;

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
        // BƯỚC 1: Validate Consultation
        Consultation consultation = consultationRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh với ID: " + request.consultationId()));

        // BƯỚC 2 & 3: Kiểm tra chéo ID bệnh nhân và bác sĩ không tin lời request
        if (!consultation.getPatientId().equals(request.patientId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Patient ID không khớp với thông tin khám bệnh!");
        }
        if (!consultation.getDoctorId().equals(request.doctorId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Doctor ID không khớp với bác sĩ phụ trách khám!");
        }

        // Sinh mã phiếu: LR-YYYYMMDD-{count+1}
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = labRequestRepository.count();
        String requestCode = "LR-" + date + "-" + String.format("%04d", count + 1);

        // BƯỚC 4: Tạo LabRequest lấy chuẩn ID từ DB
        LabRequest labRequest = LabRequest.builder()
                .consultationId(consultation.getId()) // Đổi thành getConsultationId() nếu Entity viết vậy
                .patientId(consultation.getPatientId())
                .doctorId(consultation.getDoctorId())
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