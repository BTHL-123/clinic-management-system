1. Quy tắc Quản lý Nhánh (Git Branching Strategy)
Để tránh việc đè code lên nhau, tuyệt đối không code trực tiếp trên nhánhhand. Hãy áp dụng mô hìnhFeature Branching:
hand: Nhánh chứa code ổn định nhất để demo/triển khai. Chỉ merge từ nhánhdevelop.
develop: Nhánh tích hợp các tính năng mới đã hoàn thành.
feature/ten-tinh-nang: Nhánh con để từng thành viên làm việc (Ví dụ:feature/chatbot-integration,feature/login-page,feature/voice-to-text).
hotfix/ten-law: Nhánh sửa lỗi gấp trên bản production.

2. Quy tắc Đặt tên Commit (Conventional Commits)
Nhìn vào lịch sử GitHub, mọi người phải hiểu thay đổi đó là gì. This is what it says:<type>: <description>
feat: Một tính năng mới (Ví dụ:feat: add voice-to-text recording button)
fix: Sửa lỗi (Ví dụ:fix: resolve chatbot timeout issue)
docs: Thay đổi tài liệu, README (Ví dụ:docs: update API documentation)
style: Thay đổi liên quan đến định dạng (khoảng trắng, dấu phẩy...) không đổi logic code.
refactor: Sửa code nhưng không thay đổi chức năng (Ví dụ:refactor: optimize AI prompt logic)
chore: Các việc vặt như cập nhật thư viện, cài đặt môi trường.