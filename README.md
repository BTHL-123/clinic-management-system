# 🏥 AI Clinic Management System

Hệ thống Quản lý Phòng khám Thông minh tích hợp Trí tuệ nhân tạo (AI), hỗ trợ tối ưu hóa quy trình từ khâu đặt lịch, tiếp đón, khám bệnh cho đến quản lý dược và thanh toán.

---

## 📌 1. Giới thiệu & Phạm vi (Introduction & Scope)

* **Giới thiệu:** Dự án tập trung tối ưu hóa quy trình y tế từ khâu đặt lịch đến khám chữa bệnh thông qua việc chuyển đổi số (Digital Transformation) và tích hợp trí tuệ nhân tạo (AI Integration).
* **Phạm vi (Scope):** Gói gọn quy trình từ khi Bệnh nhân có nhu cầu khám $\rightarrow$ Tiếp đón $\rightarrow$ Khám bệnh & Kê đơn $\rightarrow$ Theo dõi sau khám.
* **Đối tượng (Target Audience):** Các phòng khám đa khoa hoặc bệnh viện quy mô vừa và nhỏ.

---

## 🧩 2. Các phân hệ chính (Core Modules)

1.  **Quản lý Đặt lịch (Appointment Management):** AI Chatbot tư vấn chuyên khoa dựa trên triệu chứng, hỗ trợ đặt lịch trực tuyến/trực tiếp (Online/Offline).
2.  **Hồ sơ bệnh án điện tử (Electronic Health Record - EHR):** Lưu trữ tập trung, sử dụng mô hình ngôn ngữ lớn (LLM) để tóm tắt (Summarize) bệnh án.
3.  **Hỗ trợ Khám bệnh & Kê đơn (Clinical Decision Support):** Nhập liệu bằng giọng nói (Voice-to-Text), cảnh báo tương tác thuốc (Drug Interaction) tự động.
4.  **Điều hướng & Trải nghiệm (Patient Navigation):** Hệ thống số thứ tự thông minh và dự báo thời gian chờ dự kiến.

---

## 🛠️ 3. Cấu trúc thư mục (Project Structure)

```text
clinic-management-system/
├── backend/          # Mã nguồn máy chủ (Server-side code - Spring Boot)
├── frontend/         # Mã nguồn giao diện (Client-side code - ReactJS/Vite)
├── ai-services/      # Các module xử lý trí tuệ nhân tạo (AI Services - Python)
└── docs/             # Tài liệu đặc tả, sơ đồ hệ thống và API Contract