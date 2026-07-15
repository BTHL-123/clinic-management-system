package com.clinicmanagement.labrequest;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.labrequest.dto.CreateLabResultRequest;
import com.clinicmanagement.labrequest.dto.LabRequestResponse;
import com.clinicmanagement.labrequest.dto.LabResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LabResultService {

    private final LabResultRepository labResultRepository;
    private final LabRequestItemRepository labRequestItemRepository;
    private final LabRequestRepository labRequestRepository;

    // ── CREATE LAB RESULT ─────────────────────────────────────────────────────
    @Transactional
    public LabResultResponse create(CreateLabResultRequest request, Long enteredByUserId) {
        if (labResultRepository.existsByLabRequestItem_LabRequestItemId(request.labRequestItemId())) {
            throw new BusinessException("Kết quả xét nghiệm cho mục này đã tồn tại.");
        }

        LabRequestItem item = labRequestItemRepository.findById(request.labRequestItemId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mục xét nghiệm #" + request.labRequestItemId()));

        LabResult result = LabResult.builder()
                .labRequestItem(item)
                .resultValue(request.resultValue())
                .normalRange(request.normalRange())
                .resultUnit(request.resultUnit())
                .conclusion(request.conclusion())
                .resultFileUrl(request.resultFileUrl())
                .enteredBy(enteredByUserId)
                .build();

        LabResult saved = labResultRepository.saveAndFlush(result);

        // Cập nhật item status → COMPLETED
        item.setStatus("COMPLETED");
        labRequestItemRepository.saveAndFlush(item);

        // Nếu tất cả items đều COMPLETED → cập nhật LabRequest → COMPLETED
        LabRequest labRequest = item.getLabRequest();
        
        // Robust check without relying on JPA query cache
        boolean allDone = true;
        if (labRequest.getItems() != null) {
            for (LabRequestItem reqItem : labRequest.getItems()) {
                if (!reqItem.getLabRequestItemId().equals(item.getLabRequestItemId()) 
                    && !"COMPLETED".equals(reqItem.getStatus())) {
                    allDone = false;
                    break;
                }
            }
        }

        if (allDone) {
            labRequest.setStatus("COMPLETED");
            labRequest.setCompletedAt(LocalDateTime.now());
            labRequestRepository.save(labRequest);
        }

        return LabResultResponse.from(saved);
    }

    // ── GET BY ITEM ID ────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public LabResultResponse getByItemId(Long labRequestItemId) {
        return labResultRepository.findByLabRequestItem_LabRequestItemId(labRequestItemId)
                .map(LabResultResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy kết quả cho mục xét nghiệm #" + labRequestItemId));
    }
}
