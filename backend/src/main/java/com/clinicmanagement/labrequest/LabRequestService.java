package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;

    @Transactional(readOnly = true)
    public List<LabRequestResponse> getByConsultationId(Long consultationId) {
        List<LabRequest> requests = labRequestRepository.findByConsultationId(consultationId);
        if (requests.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Không tìm thấy phiếu xét nghiệm cho ca khám #" + consultationId);
        }
        return requests.stream().map(LabRequestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LabRequestResponse getById(Long labRequestId) {
        LabRequest request = labRequestRepository.findById(labRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phiếu xét nghiệm #" + labRequestId));
        return LabRequestResponse.from(request);
    }

    public boolean hasLabResultByConsultationId(Long consultationId) {
        return labRequestRepository.existsCompletedResultByConsultationId(consultationId);
    }
}
