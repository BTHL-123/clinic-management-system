package com.clinicmanagement.medicalrecord;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicalrecord.dto.CreateMedicalRecordRequest;
import com.clinicmanagement.medicalrecord.dto.MedicalRecordResponse;
import com.clinicmanagement.medicalrecord.dto.UpdateMedicalRecordRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    /**
     * GET /api/medical-records?patientId=&doctorId=&page=0&size=10
     * ADMIN, DOCTOR, PATIENT
     */
    @GetMapping("/medical-records")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<PageResponse<MedicalRecordResponse>>> getAll(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                medicalRecordService.getAll(patientId, doctorId, pageable)));
    }

    /**
     * GET /api/medical-records/{medicalRecordId}
     * ADMIN, DOCTOR, PATIENT
     */
    @GetMapping("/medical-records/{medicalRecordId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getById(@PathVariable Long medicalRecordId) {
        return ResponseEntity.ok(ApiResponse.success(medicalRecordService.getById(medicalRecordId)));
    }

    /**
     * POST /api/medical-records
     * DOCTOR
     */
    @PostMapping("/medical-records")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> create(
            @Valid @RequestBody CreateMedicalRecordRequest request
    ) {
        MedicalRecordResponse created = medicalRecordService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hồ sơ bệnh án thành công", created));
    }

    /**
     * PUT /api/medical-records/{medicalRecordId}
     * DOCTOR
     */
    @PutMapping("/medical-records/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> update(
            @PathVariable Long medicalRecordId,
            @RequestBody UpdateMedicalRecordRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ bệnh án thành công",
                medicalRecordService.update(medicalRecordId, request)));
    }

    /**
     * GET /api/patients/{patientId}/medical-history
     * ADMIN, DOCTOR, PATIENT
     */
    @GetMapping("/patients/{patientId}/medical-history")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getMedicalHistory(
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                medicalRecordService.getMedicalHistory(patientId)));
    }
}
