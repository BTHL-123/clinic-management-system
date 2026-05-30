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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;
    private final LabTestRepository labTestRepository;
    private final ConsultationSessionRepository consultationSessionRepository;

    @Transactional(readOnly = true)
    public List<LabRequestResponse> getByConsultationId(Long consultationId) {
        List<LabRequest> requests = labRequestRepository.findByConsultationId(consultationId);
        if (requests.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy phiếu xét nghiệm cho ca khám #" + consultationId);
        }
        return requests.stream().map(LabRequestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LabRequestResponse getById(Long labRequestId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu xét nghiệm #" + labRequestId));
        return LabRequestResponse.from(request);
    }

    @Transactional
    public LabRequestResponse create(CreateLabRequestRequest request) {
        // Dùng ConsultationSession để check chéo ID như sếp yêu cầu
        ConsultationSession consultation = consultationSessionRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc khám bệnh với ID: " + request.consultationId()));

        if (!consultation.getPatientId().equals(request.patientId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Patient ID không khớp!");
        }
        if (!consultation.getDoctorId().equals(request.doctorId())) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: Doctor ID không khớp!");
        }

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

    // Phục hồi lại hàm accept() của task 45
    @Transactional
    public LabRequestResponse accept(Long labRequestId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu xét nghiệm #" + labRequestId));

        // Logic accept cơ bản: đổi trạng thái sang ACCEPTED
        request.setStatus("ACCEPTED");
        if (request.getItems() != null) {
            request.getItems().forEach(item -> item.setStatus("ACCEPTED"));
        }

        return LabRequestResponse.from(labRequestRepository.save(request));
    }

    public boolean hasLabResultByConsultationId(Long consultationId) {
        return labRequestRepository.existsCompletedResultByConsultationId(consultationId);
    }
}