package com.clinicmanagement.department;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.department.dto.DepartmentRequest;
import com.clinicmanagement.department.dto.DepartmentResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    /**
     * GET /api/departments?page=0&size=10&sort=departmentName,asc
     * Trả về danh sách chuyên khoa có phân trang.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DepartmentResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "departmentName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAll(pageable)));
    }

    /**
     * GET /api/departments/active
     * Trả về tất cả chuyên khoa ACTIVE (không phân trang) – dùng cho dropdown.
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllActive() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAllActive()));
    }

    /**
     * GET /api/departments/{id}
     * Trả về thông tin chi tiết 1 chuyên khoa.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getById(id)));
    }

    /**
     * POST /api/departments
     * Tạo mới chuyên khoa.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponse>> create(
            @Valid @RequestBody DepartmentRequest request
    ) {
        DepartmentResponse created = departmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyên khoa thành công", created));
    }

    /**
     * PUT /api/departments/{id}
     * Cập nhật thông tin chuyên khoa.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật chuyên khoa thành công", departmentService.update(id, request)));
    }

    /**
     * DELETE /api/departments/{id}
     * Xóa chuyên khoa (chỉ khi không có bác sĩ liên kết).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chuyên khoa thành công", null));
    }
}
