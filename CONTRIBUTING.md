# ⚖️ Quy tắc đóng góp Code (Contributing Guidelines)

Để đảm bảo mã nguồn toàn dự án đồng nhất, sạch sẽ và hạn chế tối đa xung đột (conflict) mã nguồn, yêu cầu tất cả thành viên tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 🌿 1. Chiến lược phân nhánh (Branching Strategy)

Dự án áp dụng mô hình **Feature Branching** để phân tách luồng làm việc:

* `main`: Nhánh chứa mã nguồn ổn định nhất dùng để demo hoặc triển khai (deploy). **TUYỆT ĐỐI KHÔNG** lập trình hoặc tương tác trực tiếp trên nhánh này.
* `dev`: Nhánh tích hợp (integration) các tính năng mới đã hoàn thành từ các thành viên.
* `feature/ten-tinh-nang`: Nhánh con độc lập để mỗi thành viên tự phát triển task được giao (Ví dụ: `feature/department-management`).
* `hotfix/ten-loi`: Nhánh xử lý gấp các lỗi phát sinh.

### 🔄 Quy trình đẩy code lên Git chuẩn:
1. Cập nhật code mới nhất từ nhánh chung:
   `git checkout dev`
   `git pull origin dev`
2. Tạo nhánh tính năng mới từ `dev`:
   `git checkout -b feature/ten-module-cua-ban`
3. Sau khi hoàn thành code, thực hiện commit và push lên repository:
   `git add .`
   `git commit -m "feat: mô tả tính năng ngắn gọn"`
   `git push origin feature/ten-module-cua-ban`
4. Lên giao diện GitHub tạo **Pull Request (PR)** từ nhánh của bạn vào nhánh `dev`.

---

## 🚫 2. Quy định nghiêm ngặt (Strict Rules)

1. ❌ **KHÔNG tự ý chỉnh sửa API Contract** trong file `docs/api-design.md`.
2. ❌ **KHÔNG tự ý sửa đổi file `database/schema.sql`** khi chưa thông báo cho toàn đội.
3. ❌ **KHÔNG can thiệp/sửa đổi chéo code** thuộc module của người khác.

---

## 💻 3. Quy ước Lập trình Backend (Spring Boot)

* **Kiến trúc (Package by Feature):** Tất cả các thành phần thuộc một thực thể (Controller, Service, Repository, DTO) phải nằm tập trung trong cùng một package (Ví dụ: `com.clinicmanagement.department`).
* **Sử dụng DTO:** Tuyệt đối KHÔNG trả trực tiếp lớp Entity ra Controller. Phải sử dụng DTO (như `DepartmentRequest`, `DepartmentResponse`).
* **Định dạng phản hồi (ApiResponse):** Tất cả dữ liệu trả ra cho Frontend bắt buộc phải bọc qua Record `ApiResponse<T>` (Ví dụ: `return ResponseEntity.ok(ApiResponse.success(data));`).
* **Quản lý Ngoại lệ:** Sử dụng `GlobalExceptionHandler` và các Exception có sẵn trong package `common.exception`.

---

## 🎨 4. Quy ước Lập trình Frontend (React + Vite)

* **Kết nối mạng:** Luôn sử dụng `axiosClient` trong `src/services/` để gọi API. Không sử dụng `fetch` hoặc `axios` thuần.
* Các component tái sử dụng đặt tại: `src/components/`
* Các giao diện trang hoàn chỉnh đặt tại: `src/pages/`