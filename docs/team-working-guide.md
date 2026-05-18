# Team Working Guide — AI Clinic Management System

## 1. Mục tiêu file này

File này hướng dẫn các thành viên trong nhóm cách làm việc đúng quy trình khi code project.

Mục tiêu:

```text
Không code lung tung
Không push thẳng vào main
Không tự ý đổi API
Không tự ý đổi database schema
Dễ merge code
Dễ test
Dễ chia việc
```

Tất cả thành viên phải đọc file này trước khi bắt đầu code.

---

# 2. Các file tài liệu cần đọc trước

Trong project sẽ có các file quan trọng sau:

```text
docs/database-design.md
docs/api-design.md
docs/task-assignment.md
database/schema.sql
```

## 2.1. `docs/task-assignment.md`

Dùng để biết:

```text
Mình phụ trách module nào
Mình làm backend API nào
Mình làm frontend page nào
Tên branch của mình là gì
```

---

## 2.2. `docs/api-design.md`

Dùng để xem:

```text
Endpoint cần làm
HTTP method
Role được gọi API
Request body
Response body
Status code
```

Ví dụ:

```http
POST /api/appointments
```

Thì phải vào `api-design.md` để xem request và response chính xác.

Không tự ý đổi tên endpoint hoặc field.

---

## 2.3. `database/schema.sql`

Dùng để xem:

```text
Tên bảng
Tên cột
Kiểu dữ liệu
Khóa chính
Khóa ngoại
Status hợp lệ
```

Ví dụ làm appointment thì xem các bảng:

```text
appointments
appointment_slots
doctor_schedules
queue_tickets
```

---

## 2.4. `docs/database-design.md`

Dùng để hiểu:

```text
Nghiệp vụ tổng quan
Các bảng liên kết với nhau như thế nào
Flow hoạt động của hệ thống
Ý nghĩa các trạng thái
```

---

# 3. Quy tắc làm việc chung

## 3.1. Không push thẳng vào main

Tuyệt đối không làm:

```bash
git push origin main
```

Trừ leader hoặc người được phân quyền merge.

---

## 3.2. Mỗi người làm trên branch riêng

Mỗi thành viên phải tạo branch riêng theo module.

Ví dụ:

```text
feature/auth-user-security
feature/patient-doctor-department
feature/appointment-schedule-queue
feature/consultation-lab-prescription
feature/payment-inventory-ai
```

---

## 3.3. Không tự ý đổi API

Không tự ý đổi:

```text
Endpoint
Request field
Response field
Status name
Role permission
```

Nếu cần đổi phải báo nhóm trước.

Ví dụ không tự ý đổi:

```text
POST /api/appointments
```

thành:

```text
POST /api/appointments/create
```

Vì frontend hoặc người khác sẽ gọi sai.

---

## 3.4. Không tự ý đổi schema.sql

Không tự ý sửa:

```text
Tên bảng
Tên cột
Kiểu dữ liệu
Foreign key
Status
```

Nếu cần đổi database thì phải báo leader và cả nhóm.

---

## 3.5. Mỗi người chịu trách nhiệm full module của mình

Mỗi người phải làm đủ:

```text
Entity
Repository
Service
Controller
Request DTO
Response DTO
Frontend page
Frontend service gọi API
Test Postman
```

---

# 4. Cách clone project về máy

Nếu chưa có project trong máy, chạy:

```bash
git clone <repository-url>
```

Ví dụ:

```bash
git clone https://github.com/username/clinic-management-system.git
```

Sau đó vào folder project:

```bash
cd clinic-management-system
```

---

# 5. Cách lấy code mới nhất

Trước khi bắt đầu code mỗi ngày, chạy:

```bash
git checkout develop
git pull origin develop
```

Nếu project chưa có branch `develop`, tạm thời dùng:

```bash
git checkout main
git pull origin main
```

---

# 6. Cách tạo branch riêng

## 6.1. Người 1

```bash
git checkout develop
git pull origin develop
git checkout -b feature/auth-user-security
```

## 6.2. Người 2

```bash
git checkout develop
git pull origin develop
git checkout -b feature/patient-doctor-department
```

## 6.3. Người 3

```bash
git checkout develop
git pull origin develop
git checkout -b feature/appointment-schedule-queue
```

## 6.4. Người 4

```bash
git checkout develop
git pull origin develop
git checkout -b feature/consultation-lab-prescription
```

## 6.5. Người 5

```bash
git checkout develop
git pull origin develop
git checkout -b feature/payment-inventory-ai
```

Nếu chưa có branch `develop`, thay `develop` bằng `main`.

---

# 7. Cách kiểm tra mình đang ở branch nào

Chạy:

```bash
git branch
```

Branch hiện tại sẽ có dấu `*`.

Ví dụ:

```text
* feature/appointment-schedule-queue
  develop
  main
```

---

# 8. Cách code theo module

## 8.1. Backend structure gợi ý

Backend nên chia package như sau:

```text
src/main/java/com/clinicmanagement/
├── auth
├── user
├── role
├── permission
├── patient
├── doctor
├── department
├── staff
├── schedule
├── appointment
├── queue
├── consultation
├── medicalrecord
├── vitalsign
├── lab
├── prescription
├── medicine
├── inventory
├── invoice
├── payment
├── refund
├── ai
├── notification
├── review
├── article
├── report
├── file
├── common
├── config
└── security
```

---

## 8.2. Trong mỗi module nên có

Ví dụ module `patient`:

```text
patient/
├── Patient.java
├── PatientRepository.java
├── PatientService.java
├── PatientServiceImpl.java
├── PatientController.java
├── dto/
│   ├── CreatePatientRequest.java
│   ├── UpdatePatientRequest.java
│   ├── PatientResponse.java
│   └── PatientDetailResponse.java
```

---

## 8.3. Không trả Entity trực tiếp

Không nên return trực tiếp Entity từ Controller.

Không nên làm:

```java
@GetMapping
public List<Patient> getPatients() {
    return patientService.getPatients();
}
```

Nên trả DTO:

```java
@GetMapping
public ApiResponse<List<PatientResponse>> getPatients() {
    return patientService.getPatients();
}
```

---

# 9. Format response chung

Tất cả API nên trả theo format:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

# 10. Quy tắc đặt tên API

API phải bám theo `docs/api-design.md`.

Ví dụ:

```http
GET /api/patients
POST /api/patients
GET /api/patients/{patientId}
PUT /api/patients/{patientId}
DELETE /api/patients/{patientId}
```

Không tự ý đổi thành:

```http
GET /api/patient/list
POST /api/create-patient
```

---

# 11. Quy tắc đặt tên DTO

Dùng format:

```text
CreatePatientRequest
UpdatePatientRequest
PatientResponse
PatientDetailResponse
```

Ví dụ với appointment:

```text
CreateAppointmentRequest
UpdateAppointmentRequest
AppointmentResponse
AppointmentDetailResponse
```

---

# 12. Quy tắc frontend

## 12.1. Frontend structure gợi ý

```text
src/
├── pages/
│   ├── auth/
│   ├── patient/
│   ├── doctor/
│   ├── appointment/
│   ├── consultation/
│   ├── lab/
│   ├── prescription/
│   ├── payment/
│   ├── inventory/
│   ├── ai/
│   └── report/
├── services/
├── components/
├── routes/
├── context/
└── utils/
```

---

## 12.2. Mỗi module frontend nên có service riêng

Ví dụ:

```text
src/services/patientService.js
src/services/doctorService.js
src/services/appointmentService.js
src/services/paymentService.js
```

Ví dụ:

```javascript
import axiosClient from "./axiosClient";

export const getPatients = (params) => {
  return axiosClient.get("/patients", { params });
};

export const createPatient = (data) => {
  return axiosClient.post("/patients", data);
};
```

---

## 12.3. Không gọi API lung tung trực tiếp trong nhiều chỗ

Không nên mỗi component tự viết axios khác nhau.

Nên gom API vào service file.

---

# 13. Quy trình commit code

Sau khi code xong một phần nhỏ, kiểm tra file thay đổi:

```bash
git status
```

Add file:

```bash
git add .
```

Commit:

```bash
git commit -m "Implement patient CRUD API"
```

Push branch:

```bash
git push origin feature/patient-doctor-department
```

---

# 14. Quy tắc viết commit message

Commit message nên rõ ràng.

Ví dụ tốt:

```text
Implement patient CRUD API
Add appointment booking page
Fix login validation error
Add prescription response DTO
Update doctor schedule service
```

Ví dụ không tốt:

```text
update
fix
abc
done
code
```

---

# 15. Cách tạo Pull Request

Sau khi push branch lên GitHub:

```text
1. Vào GitHub repository.
2. Chọn tab Pull requests.
3. Bấm New pull request.
4. Chọn base: develop.
5. Chọn compare: branch của mình.
6. Ghi title rõ ràng.
7. Ghi mô tả đã làm gì.
8. Bấm Create pull request.
```

Ví dụ title:

```text
Implement patient doctor department module
```

Ví dụ description:

```text
Done:
- Add Patient entity, repository, service, controller
- Add Doctor entity, repository, service, controller
- Add Department CRUD API
- Add Patient and Doctor frontend pages

Tested:
- GET /api/patients
- POST /api/patients
- GET /api/doctors
- POST /api/departments
```

---

# 16. Quy tắc trước khi tạo Pull Request

Trước khi tạo Pull Request phải làm:

```text
1. Pull code mới nhất từ develop.
2. Chạy project không lỗi.
3. Test API của mình bằng Postman.
4. Kiểm tra không sửa nhầm file của người khác.
5. Commit message rõ ràng.
```

Lệnh nên chạy:

```bash
git checkout feature/ten-branch-cua-minh
git pull origin develop
```

Nếu không lỗi thì push:

```bash
git push origin feature/ten-branch-cua-minh
```

---

# 17. Cách xử lý conflict cơ bản

Nếu pull hoặc merge bị conflict, Git sẽ báo file bị conflict.

Mở file đó sẽ thấy dạng:

```text
<<<<<<< HEAD
code của mình
=======
code từ branch khác
>>>>>>> develop
```

Cách xử lý:

```text
1. Đọc kỹ hai phần code.
2. Giữ lại phần đúng.
3. Xóa các dòng <<<<<<<, =======, >>>>>>>.
4. Lưu file.
5. Chạy lại project.
6. git add .
7. git commit -m "Resolve merge conflict"
8. git push
```

Nếu không chắc thì hỏi leader, không tự xóa bừa.

---

# 18. Quy tắc test API bằng Postman

Mỗi người phải tạo collection Postman cho module của mình.

Ví dụ Người 2 tạo folder:

```text
Patient
Doctor
Department
Staff
```

Mỗi API cần test:

```text
GET list
GET detail
POST create
PUT update
DELETE
```

Nếu API cần token thì thêm:

```http
Authorization: Bearer <token>
```

---

# 19. Test data

Nếu chưa có dữ liệu thật, dùng seed data hoặc tạo dữ liệu mẫu.

Ví dụ cần test appointment thì cần có:

```text
patient_id
doctor_id
department_id
slot_id
```

Nếu chưa có frontend thì test bằng Postman trước.

---

# 20. Quy tắc phối hợp giữa các người

## 20.1. Người 1

Người 1 phải setup sớm:

```text
Backend structure
Database connection
Security basic
Common response
Frontend layout
Axios config
ProtectedRoute
```

Sau đó các người khác có thể code song song.

---

## 20.2. Người 2

Người 2 nên làm sớm:

```text
Department
Doctor
Patient
Staff
```

Vì các module khác cần:

```text
patient_id
doctor_id
department_id
```

---

## 20.3. Người 3

Người 3 phụ thuộc vào dữ liệu từ Người 2, nhưng vẫn có thể code trước bằng data giả.

Cần phối hợp với Người 2 để lấy:

```text
patient_id
doctor_id
department_id
```

---

## 20.4. Người 4

Người 4 phụ thuộc vào appointment từ Người 3.

Cần phối hợp với Người 3 để lấy:

```text
appointment_id
consultation_id
```

---

## 20.5. Người 5

Người 5 phụ thuộc vào patient, appointment, prescription.

Cần phối hợp với:

```text
Người 2: patient
Người 3: appointment
Người 4: prescription
```

---

# 21. Những phần có thể làm song song

Các phần có thể làm song song ngay:

```text
Entity
Repository
DTO
Service interface
Frontend UI tĩnh
Postman collection
Documentation
```

Các phần cần chờ người khác:

```text
End-to-end flow
Role-based security hoàn chỉnh
Frontend gọi API thật
Payment flow
Prescription dispense flow
Report flow
```

---

# 22. Quy tắc báo cáo tiến độ

Cuối mỗi ngày, mỗi người báo cáo theo format:

```text
Tên:
Hôm nay đã làm:
- ...
Đang bị kẹt:
- ...
Ngày mai làm:
- ...
Branch:
- ...
Pull Request:
- ...
```

Ví dụ:

```text
Tên: Người 3
Hôm nay đã làm:
- Tạo Appointment entity/repository/service
- Làm API tạo lịch khám
- Làm page danh sách lịch khám

Đang bị kẹt:
- Cần patient_id và doctor_id mẫu để test

Ngày mai làm:
- Check-in appointment
- Queue ticket

Branch:
- feature/appointment-schedule-queue

Pull Request:
- Chưa tạo
```

---

# 23. Quy tắc khi không hiểu task

Nếu không hiểu task, làm theo thứ tự:

```text
1. Mở docs/task-assignment.md để xem mình phụ trách gì.
2. Mở docs/api-design.md để xem endpoint cần làm.
3. Mở database/schema.sql để xem bảng và cột.
4. Mở docs/database-design.md để hiểu nghiệp vụ.
5. Nếu vẫn chưa hiểu thì hỏi leader.
```

Không tự đoán rồi code lệch.

---

# 24. Checklist trước khi báo hoàn thành module

Mỗi người phải kiểm tra:

```text
Backend:
[ ] Entity đã đúng schema.sql
[ ] Repository đã tạo
[ ] Service đã xử lý logic
[ ] Controller đúng endpoint trong api-design.md
[ ] Request DTO đúng field
[ ] Response DTO đúng field
[ ] Validation cơ bản đã có
[ ] Test Postman thành công

Frontend:
[ ] Có page list
[ ] Có page create/update nếu cần
[ ] Có service gọi API
[ ] Có loading
[ ] Có error message
[ ] Có gọi đúng endpoint
[ ] Có test bằng tài khoản đúng role

Git:
[ ] Code nằm đúng branch
[ ] Pull code mới nhất từ develop
[ ] Không sửa nhầm file người khác
[ ] Commit message rõ ràng
[ ] Đã push branch
[ ] Đã tạo Pull Request
```

---

# 25. Branch của từng người

```text
Người 1:
feature/auth-user-security

Người 2:
feature/patient-doctor-department

Người 3:
feature/appointment-schedule-queue

Người 4:
feature/consultation-lab-prescription

Người 5:
feature/payment-inventory-ai
```

---

# 26. Phân công tóm tắt

```text
Người 1:
Auth + User + Role + Security + Layout

Người 2:
Patient + Doctor + Department + Staff

Người 3:
Schedule + Appointment + Queue + Notification

Người 4:
Consultation + Medical Record + Lab + Prescription

Người 5:
Payment + Inventory + AI + Review + Article + Report
```

---

# 27. Lưu ý quan trọng

```text
Code theo api-design.md.
Entity theo schema.sql.
Task theo task-assignment.md.
Không tự ý đổi endpoint.
Không tự ý đổi database.
Không push thẳng vào main.
Không merge khi chưa test.
Không sửa file của người khác nếu chưa báo.
```

---

# 28. Quy trình chuẩn một ngày làm việc

```text
1. git checkout develop
2. git pull origin develop
3. git checkout branch của mình
4. git pull origin develop
5. Code task của mình
6. Test bằng Postman hoặc frontend
7. git status
8. git add .
9. git commit -m "message rõ ràng"
10. git push origin branch của mình
11. Tạo Pull Request nếu task đã ổn
12. Báo cáo tiến độ cho nhóm
```

---

# 29. Khi project gần demo

Trước ngày demo, cả nhóm phải test flow chính:

```text
1. Admin đăng nhập
2. Admin tạo chuyên khoa
3. Admin tạo bác sĩ
4. Admin tạo lịch làm việc bác sĩ
5. Generate slot
6. Patient đăng ký
7. Patient đặt lịch
8. Receptionist check-in
9. Doctor khám bệnh
10. Doctor nhập bệnh án
11. Doctor kê đơn thuốc
12. Receptionist tạo hóa đơn
13. Patient thanh toán
14. Pharmacist cấp thuốc
15. Admin xem báo cáo
```

Nếu flow này chạy được thì project đã đủ để demo.

---

# 30. Kết luận

Mỗi thành viên chỉ cần nhớ:

```text
Xem task-assignment.md để biết mình làm gì.
Xem api-design.md để biết API làm như nào.
Xem schema.sql để biết database ra sao.
Code trên branch riêng.
Test trước khi push.
Tạo Pull Request, không push thẳng main.
```
