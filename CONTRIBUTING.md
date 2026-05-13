# Quy định Đóng góp (Contributing Guidelines)

Tất cả thành viên trong nhóm bắt buộc tuân thủ quy trình dưới đây để đảm bảo chất lượng mã nguồn (code quality):

## 1. Quy trình làm việc (Workflow)
1. Cập nhật mã nguồn mới nhất: `git checkout dev` -> `git pull origin dev`.
2. Tạo nhánh tính năng mới: `git checkout -b feature/ten-cua-ban`.
3. Sau khi hoàn thành, đẩy nhánh lên máy chủ (push): `git push origin feature/ten-cua-ban`.
4. Tạo yêu cầu gộp mã (Pull Request - PR) trên GitHub để trưởng nhóm duyệt mã (Review).

## 2. Tiêu chuẩn mã nguồn (Coding Standards)
- **Biến môi trường (Environment Variables):** Tuyệt đối không đẩy tệp `.env` chứa mã khóa (API Key) lên Git. Hãy sử dụng tệp mẫu `.env.example`.
- **Xử lý bất đồng bộ (Async/Await):** Các hàm gọi trí tuệ nhân tạo (AI API) phải có trạng thái chờ (Loading State) ở giao diện (Frontend).
- **Quản lý câu lệnh (Prompt Management):** Lưu trữ các câu lệnh (prompts) trong thư mục riêng để dễ dàng tinh chỉnh.

## 3. Kiểm duyệt mã (Code Review)
- Ít nhất một thành viên khác phải kiểm duyệt (review) đoạn mã trước khi được phép gộp (merge) vào nhánh `dev`.
- Ưu tiên sử dụng công cụ AI Studio để kiểm tra lỗi logic và bảo mật trước khi tạo PR.