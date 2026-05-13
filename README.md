# Hệ thống Quản lý Phòng Khám Thông minh (AI Clinic Management System)

## 1. Giới thiệu & Phạm vi (Introduction & Scope)
- **Giới thiệu:** Dự án tập trung tối ưu hóa quy trình y tế từ khâu đặt lịch đến khám chữa bệnh thông qua việc chuyển đổi số (Digital Transformation) và tích hợp trí tuệ nhân tạo (AI Integration).
- **Phạm vi (Scope):** Gói gọn quy trình từ khi Bệnh nhân có nhu cầu khám -> Tiếp đón -> Khám bệnh & Kê đơn -> Theo dõi sau khám.
- **Đối tượng (Target Audience):** Các phòng khám đa khoa hoặc bệnh viện quy mô vừa và nhỏ.

## 2. Các phân hệ chính (Core Modules)
1. **Quản lý Đặt lịch (Appointment Management):** AI Chatbot tư vấn chuyên khoa dựa trên triệu chứng, hỗ trợ đặt lịch trực tuyến/trực tiếp (Online/Offline).
2. **Hồ sơ bệnh án điện tử (Electronic Health Record - EHR):** Lưu trữ tập trung, sử dụng mô hình ngôn ngữ lớn (LLM) để tóm tắt (Summarize) bệnh án.
3. **Hỗ trợ Khám bệnh & Kê đơn (Clinical Decision Support):** Nhập liệu bằng giọng nói (Voice-to-Text), cảnh báo tương tác thuốc (Drug Interaction) tự động.
4. **Điều hướng & Trải nghiệm (Patient Navigation):** Hệ thống số thứ tự thông minh và dự báo thời gian chờ dự kiến.

## 3. Quy tắc phát triển (Development Guidelines)

### Chiến lược phân nhánh (Branching Strategy)
Để tránh việc ghi đè mã nguồn (code) lên nhau, dự án áp dụng mô hình **Feature Branching**:
- **`main`**: Nhánh (branch) chứa mã nguồn ổn định nhất để demo/triển khai (deploy). Tuyệt đối KHÔNG lập trình trực tiếp trên nhánh này. Chỉ gộp (merge) từ nhánh `dev`.
- **`dev`**: Nhánh tích hợp (integration) các tính năng mới đã hoàn thành.
- **`feature/ten-tinh-nang`**: Nhánh con để từng thành viên làm việc độc lập. (Ví dụ: `feature/chatbot-ui`, `feature/voice-to-text`).
- **`hotfix/ten-loi`**: Nhánh sửa lỗi gấp trên bản phát hành (production).

### Quy tắc đặt tên Commit (Conventional Commits)
- `feat`: Một tính năng (feature) mới.
- `fix`: Sửa lỗi (bug fix).
- `docs`: Thay đổi tài liệu, README (documentation).
- `style`: Thay đổi định dạng (format) code, không đổi logic.
- `refactor`: Tái cấu trúc mã nguồn (refactoring) để tối ưu hơn.
- `chore`: Các việc vặt (cài đặt thư viện, cấu hình môi trường).

## 4. Cấu trúc thư mục (Project Structure)
- `backend/`: Mã nguồn máy chủ (Server-side code).
- `frontend/`: Mã nguồn giao diện (Client-side code).
- `ai-services/`: Các module xử lý trí tuệ nhân tạo (AI services).
- `docs/`: Tài liệu đặc tả và sơ đồ hệ thống.