# Quy định đóng góp (Contributing Guidelines)

## 1. Quy tắc nhánh (Branching)
- Tuyệt đối không code trực tiếp trên `main` hoặc `develop`.
- Tạo nhánh mới từ `develop`: `feature/ten-tinh-nang` hoặc `fix/ten-loi`.

## 2. Quy tắc Commit
Sử dụng format: `<type>: <description>`
- `feat`: Tính năng mới.
- `fix`: Sửa lỗi.
- `docs`: Cập nhật tài liệu.
- `refactor`: Tối ưu code.

## 3. Quy trình gộp code (Pull Request)
1. Hoàn thành code ở nhánh feature.
2. Tạo Pull Request (PR) từ `feature/...` vào `develop`.
3. Tag ít nhất 1 thành viên khác vào Review.
4. Sau khi được Approve, mới tiến hành Merge.

## 4. Quản lý API Key
- Không bao giờ push file `.env` lên GitHub.
- Cập nhật các biến môi trường mới vào file `.env.example`.