# 🏗️ Architecture Guide — Clinic Management System (Backend)

> **Tài liệu này là nguồn tham chiếu chính cho tất cả các thành viên (và AI) khi viết code.**
> Mọi module mới PHẢI tuân thủ các convention dưới đây.

---

## 1. Kiến trúc 3 Lớp (3-Layer Architecture)

Mọi request đi theo **một chiều duy nhất**:

```
Client → Controller → Service (interface) → ServiceImpl → Repository → Database
```

| Tầng | Trách nhiệm | Annotation |
|------|-------------|------------|
| **Controller** | Nhận request, validate input, trả response. **KHÔNG** chứa logic nghiệp vụ. | `@RestController` |
| **Service (Interface)** | Định nghĩa các phương thức nghiệp vụ. **KHÔNG** chứa implementation. | *(không có annotation)* |
| **ServiceImpl** | Triển khai logic nghiệp vụ. Đây là "trái tim" của ứng dụng. | `@Service` |
| **Repository** | Giao tiếp với Database. Sử dụng Spring Data JPA. | `extends JpaRepository` |

---

## 2. Cấu trúc thư mục chuẩn

Mỗi module (feature) được tổ chức theo cấu trúc sau:

```
com.clinicmanagement.<module>/
├── <Entity>.java                  # JPA Entity (@Entity)
├── <Module>Controller.java        # REST Controller (@RestController)
├── <Module>Service.java           # Service Interface
├── <Module>ServiceImpl.java       # Service Implementation (@Service)
├── <Module>Repository.java        # JPA Repository (extends JpaRepository)
└── dto/
    ├── <Module>Request.java        # Request DTO (Java record + validation)
    └── <Module>Response.java       # Response DTO (Java record + static from())
```

### Ví dụ cụ thể — module `doctor`:
```
com.clinicmanagement.doctor/
├── Doctor.java                    # Entity
├── DoctorController.java          # @RestController
├── DoctorService.java             # Interface
├── DoctorServiceImpl.java         # @Service implements DoctorService
├── DoctorRepository.java          # extends JpaRepository<Doctor, Long>
└── dto/
    ├── DoctorRequest.java          # record DoctorRequest(...)
    └── DoctorResponse.java         # record DoctorResponse(...) { static from(Doctor) }
```

---

## 3. Quy tắc viết code

### 3.1 Controller
```java
@RestController
@RequestMapping("/<resource-plural>")   // ví dụ: /doctors, /patients, /appointments
@RequiredArgsConstructor
public class XxxController {

    private final XxxService xxxService;  // Inject INTERFACE, không phải Impl

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<XxxResponse>>> getAll(...) {
        return ResponseEntity.ok(ApiResponse.success(xxxService.getAll(...)));
    }
}
```

**Quy tắc:**
- Inject **interface** (`XxxService`), KHÔNG inject implementation (`XxxServiceImpl`).
- Response luôn được bọc trong `ApiResponse<T>` (từ `common.dto`).
- Phân trang dùng `PageResponse<T>` (từ `common.dto`).
- Validation dùng `@Valid @RequestBody`.
- Phân quyền dùng `@PreAuthorize("hasAnyRole(...)")`.

### 3.2 Service Interface
```java
public interface XxxService {

    PageResponse<XxxResponse> getAll(Pageable pageable);

    XxxResponse getById(Long id);

    XxxResponse create(XxxRequest request);

    XxxResponse update(Long id, XxxRequest request);

    void delete(Long id);
}
```

**Quy tắc:**
- **KHÔNG** có annotation `@Service`.
- **KHÔNG** có logic, chỉ khai báo method signatures.
- Import DTO từ `<module>.dto.*`.

### 3.3 Service Implementation
```java
@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {

    private final XxxRepository xxxRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<XxxResponse> getAll(Pageable pageable) {
        // Logic nghiệp vụ ở đây
    }

    @Override
    @Transactional
    public XxxResponse create(XxxRequest request) {
        // Logic nghiệp vụ ở đây
    }
}
```

**Quy tắc:**
- Đặt `@Override` trước mỗi method được implement từ interface.
- Đọc dữ liệu: `@Transactional(readOnly = true)`.
- Ghi dữ liệu: `@Transactional`.
- Ném `ResourceNotFoundException` khi không tìm thấy entity.
- Ném `BusinessException` khi vi phạm logic nghiệp vụ.

### 3.4 DTO (Data Transfer Object)
```java
// Request DTO — dùng cho dữ liệu đầu vào
public record XxxRequest(
        @NotBlank(message = "Tên không được để trống")
        String name,

        @NotNull(message = "ID không được để trống")
        Long relatedId
) {}

// Response DTO — dùng cho dữ liệu đầu ra
public record XxxResponse(
        Long id,
        String name,
        ...
) {
    public static XxxResponse from(XxxEntity entity) {
        return new XxxResponse(
                entity.getId(),
                entity.getName(),
                ...
        );
    }
}
```

**Quy tắc:**
- Dùng Java `record` (KHÔNG dùng class).
- DTO nằm trong thư mục `dto/`, package `com.clinicmanagement.<module>.dto`.
- Response DTO có static method `from(Entity)` để mapping.
- Request DTO có Jakarta Validation annotations.

### 3.5 Repository
```java
@Repository  // (tuỳ chọn, JpaRepository tự đăng ký bean)
public interface XxxRepository extends JpaRepository<Xxx, Long> {

    // Custom query nếu cần
    @Query("SELECT x FROM Xxx x WHERE ...")
    List<Xxx> findByCustomCondition(...);
}
```

---

## 4. Các class dùng chung (package `common`)

| Class | Mục đích |
|-------|----------|
| `ApiResponse<T>` | Bọc tất cả response trả về client. Có `success()` và `error()`. |
| `PageResponse<T>` | Bọc dữ liệu phân trang (page, size, totalPages, content). |
| `ResourceNotFoundException` | Khi không tìm thấy entity (trả HTTP 404). |
| `BusinessException` | Khi vi phạm logic nghiệp vụ (trả HTTP 400). |

---

## 5. Quy tắc đặt tên

| Thành phần | Quy tắc | Ví dụ |
|------------|---------|-------|
| Entity | Danh từ số ít | `Doctor`, `Patient`, `Appointment` |
| Controller | `<Entity>Controller` | `DoctorController` |
| Service Interface | `<Entity>Service` | `DoctorService` |
| Service Impl | `<Entity>ServiceImpl` | `DoctorServiceImpl` |
| Repository | `<Entity>Repository` | `DoctorRepository` |
| Request DTO | `<Action/Entity>Request` | `DoctorRequest`, `BookAppointmentRequest` |
| Response DTO | `<Entity>Response` | `DoctorResponse`, `AppointmentResponse` |
| API Endpoint | `/api/<resource-plural>` | `/api/doctors`, `/api/appointments` |

---

## 6. Checklist khi tạo module mới

- [ ] Tạo Entity class (`@Entity`, `@Table`)
- [ ] Tạo Repository (`extends JpaRepository<Entity, Long>`)
- [ ] Tạo DTO trong thư mục `dto/`:
  - [ ] `XxxRequest.java` (record + validation)
  - [ ] `XxxResponse.java` (record + `static from()`)
- [ ] Tạo Service interface (`XxxService.java`)
- [ ] Tạo Service implementation (`XxxServiceImpl.java`, `@Service`, `implements XxxService`)
- [ ] Tạo Controller (`XxxController.java`, `@RestController`)
- [ ] Bọc response trong `ApiResponse<T>`
- [ ] Thêm `@PreAuthorize` cho các endpoint cần phân quyền

---

## 7. Các module hiện có

| Module | Package | Mô tả |
|--------|---------|-------|
| `appointment` | `com.clinicmanagement.appointment` | Quản lý lịch hẹn, lịch BS, slot, walk-in |
| `doctor` | `com.clinicmanagement.doctor` | Quản lý bác sĩ |
| `patient` | `com.clinicmanagement.patient` | Quản lý bệnh nhân |
| `department` | `com.clinicmanagement.department` | Quản lý chuyên khoa |
| `consultation` | `com.clinicmanagement.consultation` | Quản lý phiên khám |
| `medicalrecord` | `com.clinicmanagement.medicalrecord` | Hồ sơ bệnh án |
| `medicine` | `com.clinicmanagement.medicine` | Quản lý thuốc |
| `medicalservice` | `com.clinicmanagement.medicalservice` | Dịch vụ y tế |
| `lab` | `com.clinicmanagement.lab` | Xét nghiệm |
| `invoice` | `com.clinicmanagement.invoice` | Hóa đơn |
| `payment` | `com.clinicmanagement.payment` | Thanh toán & hoàn tiền |
| `inventory` | `com.clinicmanagement.inventory` | Kho thuốc & nhà cung cấp |
| `vitalsign` | `com.clinicmanagement.vitalsign` | Chỉ số sinh tồn |
| `auth` | `com.clinicmanagement.auth` | Đăng nhập, đăng ký, OTP |
| `user` | `com.clinicmanagement.user` | Quản lý tài khoản |
| `aichat` | `com.clinicmanagement.aichat` | Tư vấn AI (Gemini) |
| `auditlog` | `com.clinicmanagement.auditlog` | Nhật ký hệ thống |
| `systemsetting` | `com.clinicmanagement.systemsetting` | Cài đặt hệ thống |

---

> **⚠️ LƯU Ý QUAN TRỌNG**: Khi tham khảo bất kỳ module nào ở trên để viết code mới, hãy luôn tuân theo đúng pattern `Interface + Impl` và đặt DTO trong thư mục `dto/`. Nếu bạn đang sử dụng AI để sinh code, hãy cung cấp file này làm context.
