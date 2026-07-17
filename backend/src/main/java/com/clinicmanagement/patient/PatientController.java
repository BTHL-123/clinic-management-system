package com.clinicmanagement.patient;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.patient.dto.PatientProfileUpdateRequest;
import com.clinicmanagement.patient.dto.PatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PageResponse<PatientResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "patientId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.success(
                patientService.getAll(keyword, pageable)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PatientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> create(
            @Valid @RequestBody PatientRequest request
    ) {
        PatientResponse created = patientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hồ sơ bệnh nhân thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật hồ sơ bệnh nhân thành công", patientService.update(id, request))
        );
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getMyProfile() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(ApiResponse.success(patientService.getMyProfile(userId)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> updateMyProfile(
            @Valid @RequestBody PatientProfileUpdateRequest request
    ) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật hồ sơ cá nhân thành công", patientService.updateMyProfile(userId, request))
        );
    }

    @GetMapping("/my-profiles")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<java.util.List<PatientResponse>>> getMyProfiles() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(ApiResponse.success(patientService.getMyProfiles(userId)));
    }

    @PostMapping("/my-profiles")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> createDependentProfile(
            @Valid @RequestBody PatientRequest request
    ) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm hồ sơ người thân thành công", patientService.createDependentProfile(userId, request)));
    }

    private Long getAuthenticatedUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() instanceof String) {
            throw new com.clinicmanagement.common.exception.BusinessException("Không thể xác thực thông tin người dùng.");
        }
        com.clinicmanagement.security.CustomUserDetails userDetails = (com.clinicmanagement.security.CustomUserDetails) auth.getPrincipal();
        return userDetails.getUser().getUserId();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa hồ sơ bệnh nhân thành công", null));
    }
}
