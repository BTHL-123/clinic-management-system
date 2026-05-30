package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.lab.LabTest;
import com.clinicmanagement.lab.LabTestRepository;
import com.clinicmanagement.labrequest.dto.CreateLabRequestRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime; // Thêm import này
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;
    private final LabTestRepository labTestRepository;
    private final ConsultationSessionRepository consultationSessionRepository;

    // ... [Giữ nguyên getByConsultationId và getById như cũ] ...

    @Transactional
    public LabRequestResponse create(CreateLabRequestRequest request) {
        // [Logic create giữ nguyên validation như cũ]
        ConsultationSession consultation = consultationSessionRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh với ID: " + request.consultationId()));
        // ... (Giữ nguyên phần validate PatientId và DoctorId)

        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = labRequestRepository.count();
        String requestCode = "LR-" + date + "-" + String.format("%04d", count + 1);

        LabRequest labRequest = LabRequest.builder()
                .consultationId(consultation.getConsultationId())
                .patientId(consultation.getPatientId())
                .doctorId(consultation.getDoctorId())
                .requestCode(requestCode)
                .note(request.note())
                .status("REQUESTED")
                .build();

        for (Long labTestId : request.labTestIds()) {
            LabTest labTest = labTestRepository.findById(labTestId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại xét nghiệm #" + labTestId));
            LabRequestItem item = LabRequestItem.builder()
                    .labRequest(labRequest)
                    .labTest(labTest)
                    .status("REQUESTED")
                    .build();
            labRequest.getItems().add(item);
        }
        return LabRequestResponse.from(labRequestRepository.save(labRequest));
    }

    // SỬA HÀM ACCEPT THEO YÊU CẦU MỚI
    @Transactional
    public LabRequestResponse accept(Long labRequestId, Long acceptedByUserId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu xét nghiệm #" + labRequestId));

        request.setStatus("IN_PROGRESS");
        request.setAcceptedBy(acceptedByUserId);
        request.setAcceptedAt(LocalDateTime.now());

        if (request.getItems() != null) {
            request.getItems().forEach(item -> item.setStatus("IN_PROGRESS"));
        }

        return LabRequestResponse.from(labRequestRepository.save(request));
    }

    public boolean hasLabResultByConsultationId(Long consultationId) {
        return labRequestRepository.existsCompletedResultByConsultationId(consultationId);
    }
}