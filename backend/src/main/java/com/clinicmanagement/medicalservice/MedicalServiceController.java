package com.clinicmanagement.medicalservice;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.medicalservice.dto.MedicalServiceRequest;
import com.clinicmanagement.medicalservice.dto.MedicalServiceResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/medical-services")
@RequiredArgsConstructor
public class MedicalServiceController {

    private final MedicalServiceService medicalServiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MedicalServiceResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "serviceName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getAll(pageable)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<MedicalServiceResponse>>> getAllActive() {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getAllActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalServiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MedicalServiceResponse>> create(
            @Valid @RequestBody MedicalServiceRequest request
    ) {
        MedicalServiceResponse created = medicalServiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo dịch vụ y tế thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MedicalServiceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody MedicalServiceRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật dịch vụ y tế thành công", medicalServiceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        medicalServiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa dịch vụ y tế thành công", null));
    }
}
