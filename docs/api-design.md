# API Design — AI Clinic Management System

## 1. Mục tiêu tài liệu

Tài liệu này chốt toàn bộ API contract cho dự án **AI Clinic Management System**.

Tài liệu dùng cho:

- Backend developer code Controller / Service / DTO.
- Frontend developer biết endpoint để gọi.
- Tester dùng Postman test API.
- Nhóm chia việc theo module rõ ràng.

---

## 2. Quy ước chung

## 2.1. Base URL

```text
/api
```

Ví dụ:

```text
/api/auth/login
/api/patients
/api/appointments
```

---

## 2.2. Format response chung

Tất cả API nên trả về format thống nhất:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Nếu lỗi:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## 2.3. Pagination response

Với API danh sách, response nên có dạng:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "last": false
  }
}
```

Query params chuẩn:

```text
?page=0&size=10&sort=createdAt,desc
```

---

## 2.4. Authentication

Các API cần đăng nhập dùng header:

```http
Authorization: Bearer <access_token>
```

---

## 2.5. Role trong hệ thống

```text
PATIENT
DOCTOR
RECEPTIONIST
ADMIN
PHARMACIST
LAB_TECHNICIAN
```

---

## 2.6. HTTP status code

```text
200 OK                Lấy / cập nhật dữ liệu thành công
201 Created           Tạo mới thành công
204 No Content        Xóa thành công
400 Bad Request       Request sai
401 Unauthorized      Chưa đăng nhập
403 Forbidden         Không có quyền
404 Not Found         Không tìm thấy dữ liệu
409 Conflict          Trùng dữ liệu hoặc xung đột trạng thái
500 Server Error      Lỗi server
```

---

# 3. Auth API

## 3.1. Register patient

```http
POST /api/auth/register
```

Role:

```text
PUBLIC
```

Request:

```json
{
  "fullName": "Nguyen Van A",
  "email": "patient@example.com",
  "password": "123456",
  "phone": "0909000000",
  "gender": "MALE",
  "dateOfBirth": "2000-01-01",
  "address": "Da Nang"
}
```

Response:

```json
{
  "userId": 1,
  "patientId": 1,
  "email": "patient@example.com",
  "role": "PATIENT"
}
```

---

## 3.2. Login

```http
POST /api/auth/login
```

Role:

```text
PUBLIC
```

Request:

```json
{
  "email": "patient@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": 1,
    "fullName": "Nguyen Van A",
    "email": "patient@example.com",
    "roles": ["PATIENT"]
  }
}
```

---

## 3.3. Refresh token

```http
POST /api/auth/refresh-token
```

Role:

```text
PUBLIC
```

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Response:

```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

## 3.4. Logout

```http
POST /api/auth/logout
```

Role:

```text
AUTHENTICATED
```

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Response:

```json
{
  "message": "Logout successfully"
}
```

---

## 3.5. Forgot password

```http
POST /api/auth/forgot-password
```

Role:

```text
PUBLIC
```

Request:

```json
{
  "email": "patient@example.com"
}
```

Response:

```json
{
  "message": "Password reset email has been sent"
}
```

---

## 3.6. Reset password

```http
POST /api/auth/reset-password
```

Role:

```text
PUBLIC
```

Request:

```json
{
  "token": "reset_token",
  "newPassword": "new_password"
}
```

Response:

```json
{
  "message": "Password has been reset successfully"
}
```

---

## 3.7. Get current user

```http
GET /api/auth/me
```

Role:

```text
AUTHENTICATED
```

Response:

```json
{
  "userId": 1,
  "fullName": "Nguyen Van A",
  "email": "patient@example.com",
  "phone": "0909000000",
  "roles": ["PATIENT"],
  "status": "ACTIVE"
}
```

---

# 4. User API

## 4.1. Get users

```http
GET /api/users
```

Role:

```text
ADMIN
```

Query params:

```text
?page=0&size=10&keyword=nguyen&status=ACTIVE&role=DOCTOR
```

Response item:

```json
{
  "userId": 1,
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0909000000",
  "status": "ACTIVE",
  "roles": ["DOCTOR"]
}
```

---

## 4.2. Get user by id

```http
GET /api/users/{userId}
```

Role:

```text
ADMIN
```

---

## 4.3. Create user

```http
POST /api/users
```

Role:

```text
ADMIN
```

Request:

```json
{
  "fullName": "Tran Thi B",
  "email": "staff@example.com",
  "password": "123456",
  "phone": "0909111222",
  "roles": ["RECEPTIONIST"]
}
```

---

## 4.4. Update user

```http
PUT /api/users/{userId}
```

Role:

```text
ADMIN
```

Request:

```json
{
  "fullName": "Tran Thi B Updated",
  "phone": "0909333444",
  "status": "ACTIVE"
}
```

---

## 4.5. Lock user

```http
PUT /api/users/{userId}/lock
```

Role:

```text
ADMIN
```

---

## 4.6. Unlock user

```http
PUT /api/users/{userId}/unlock
```

Role:

```text
ADMIN
```

---

## 4.7. Delete user

```http
DELETE /api/users/{userId}
```

Role:

```text
ADMIN
```

---

# 5. Role & Permission API

## 5.1. Get roles

```http
GET /api/roles
```

Role:

```text
ADMIN
```

---

## 5.2. Create role

```http
POST /api/roles
```

Role:

```text
ADMIN
```

Request:

```json
{
  "roleName": "MANAGER",
  "description": "Clinic manager role"
}
```

---

## 5.3. Update role

```http
PUT /api/roles/{roleId}
```

Role:

```text
ADMIN
```

---

## 5.4. Delete role

```http
DELETE /api/roles/{roleId}
```

Role:

```text
ADMIN
```

---

## 5.5. Get permissions

```http
GET /api/permissions
```

Role:

```text
ADMIN
```

---

## 5.6. Assign permissions to role

```http
PUT /api/roles/{roleId}/permissions
```

Role:

```text
ADMIN
```

Request:

```json
{
  "permissionIds": [1, 2, 3, 4]
}
```

---

# 6. Patient API

## 6.1. Get patients

```http
GET /api/patients
```

Role:

```text
ADMIN, RECEPTIONIST, DOCTOR
```

Query params:

```text
?page=0&size=10&keyword=nguyen&phone=0909
```

Response item:

```json
{
  "patientId": 1,
  "patientCode": "PAT000001",
  "fullName": "Nguyen Van A",
  "gender": "MALE",
  "dateOfBirth": "2000-01-01",
  "phone": "0909000000",
  "email": "patient@example.com"
}
```

---

## 6.2. Get patient by id

```http
GET /api/patients/{patientId}
```

Role:

```text
ADMIN, RECEPTIONIST, DOCTOR, PATIENT_OWNER
```

---

## 6.3. Create patient

```http
POST /api/patients
```

Role:

```text
ADMIN, RECEPTIONIST
```

Request:

```json
{
  "fullName": "Nguyen Van A",
  "gender": "MALE",
  "dateOfBirth": "2000-01-01",
  "phone": "0909000000",
  "email": "patient@example.com",
  "address": "Da Nang",
  "identityNumber": "123456789",
  "insuranceNumber": "BHYT123",
  "emergencyContactName": "Nguyen Van B",
  "emergencyContactPhone": "0909111222",
  "bloodType": "O",
  "allergies": "Penicillin",
  "medicalHistory": "No serious disease"
}
```

---

## 6.4. Update patient

```http
PUT /api/patients/{patientId}
```

Role:

```text
ADMIN, RECEPTIONIST, PATIENT_OWNER
```

---

## 6.5. Delete patient

```http
DELETE /api/patients/{patientId}
```

Role:

```text
ADMIN
```

---

## 6.6. Get current patient's profile

```http
GET /api/patients/me
```

Role:

```text
PATIENT
```

---

## 6.7. Update current patient's profile

```http
PUT /api/patients/me
```

Role:

```text
PATIENT
```

---

# 7. Department API

## 7.1. Get departments

```http
GET /api/departments
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?status=ACTIVE
```

---

## 7.2. Get department by id

```http
GET /api/departments/{departmentId}
```

Role:

```text
PUBLIC, AUTHENTICATED
```

---

## 7.3. Create department

```http
POST /api/departments
```

Role:

```text
ADMIN
```

Request:

```json
{
  "departmentName": "Cardiology",
  "description": "Heart examination department"
}
```

---

## 7.4. Update department

```http
PUT /api/departments/{departmentId}
```

Role:

```text
ADMIN
```

---

## 7.5. Delete department

```http
DELETE /api/departments/{departmentId}
```

Role:

```text
ADMIN
```

---

# 8. Doctor API

## 8.1. Get doctors

```http
GET /api/doctors
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?page=0&size=10&departmentId=1&keyword=nguyen&status=ACTIVE
```

Response item:

```json
{
  "doctorId": 1,
  "doctorCode": "DOC000001",
  "fullName": "Dr. Nguyen Van B",
  "departmentId": 1,
  "departmentName": "Cardiology",
  "degree": "Specialist I",
  "specialization": "Heart disease",
  "yearsOfExperience": 10,
  "consultationFee": 200000,
  "status": "ACTIVE"
}
```

---

## 8.2. Get doctor by id

```http
GET /api/doctors/{doctorId}
```

Role:

```text
PUBLIC, AUTHENTICATED
```

---

## 8.3. Create doctor

```http
POST /api/doctors
```

Role:

```text
ADMIN
```

Request:

```json
{
  "userId": 2,
  "departmentId": 1,
  "doctorCode": "DOC000001",
  "degree": "Specialist I",
  "specialization": "Cardiology",
  "yearsOfExperience": 10,
  "biography": "Experienced doctor",
  "consultationFee": 200000
}
```

---

## 8.4. Update doctor

```http
PUT /api/doctors/{doctorId}
```

Role:

```text
ADMIN
```

---

## 8.5. Delete doctor

```http
DELETE /api/doctors/{doctorId}
```

Role:

```text
ADMIN
```

---

## 8.6. Get current doctor's profile

```http
GET /api/doctors/me
```

Role:

```text
DOCTOR
```

---

# 9. Staff API

## 9.1. Get staff list

```http
GET /api/staff
```

Role:

```text
ADMIN
```

Query params:

```text
?page=0&size=10&staffType=RECEPTIONIST&status=ACTIVE
```

---

## 9.2. Get staff by id

```http
GET /api/staff/{staffId}
```

Role:

```text
ADMIN
```

---

## 9.3. Create staff

```http
POST /api/staff
```

Role:

```text
ADMIN
```

Request:

```json
{
  "userId": 3,
  "staffCode": "STAFF000001",
  "staffType": "RECEPTIONIST",
  "position": "Front desk"
}
```

---

## 9.4. Update staff

```http
PUT /api/staff/{staffId}
```

Role:

```text
ADMIN
```

---

## 9.5. Delete staff

```http
DELETE /api/staff/{staffId}
```

Role:

```text
ADMIN
```

---

# 10. Doctor Schedule API

## 10.1. Get doctor schedules

```http
GET /api/doctor-schedules
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?doctorId=1&fromDate=2026-05-20&toDate=2026-05-30&status=AVAILABLE
```

---

## 10.2. Get schedule by id

```http
GET /api/doctor-schedules/{scheduleId}
```

Role:

```text
PUBLIC, AUTHENTICATED
```

---

## 10.3. Create doctor schedule

```http
POST /api/doctor-schedules
```

Role:

```text
ADMIN
```

Request:

```json
{
  "doctorId": 1,
  "workDate": "2026-05-20",
  "startTime": "08:00",
  "endTime": "11:00",
  "maxPatients": 20
}
```

---

## 10.4. Update doctor schedule

```http
PUT /api/doctor-schedules/{scheduleId}
```

Role:

```text
ADMIN
```

---

## 10.5. Cancel doctor schedule

```http
PUT /api/doctor-schedules/{scheduleId}/cancel
```

Role:

```text
ADMIN
```

Request:

```json
{
  "reason": "Doctor is unavailable"
}
```

---

## 10.6. Generate appointment slots

```http
POST /api/doctor-schedules/{scheduleId}/generate-slots
```

Role:

```text
ADMIN
```

Request:

```json
{
  "slotDurationMinutes": 15
}
```

Response:

```json
{
  "scheduleId": 1,
  "generatedSlots": 12
}
```

---

# 11. Appointment Slot API

## 11.1. Get available slots

```http
GET /api/appointment-slots/available
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?doctorId=1&date=2026-05-20
```

Response item:

```json
{
  "slotId": 1,
  "doctorId": 1,
  "date": "2026-05-20",
  "startTime": "08:00",
  "endTime": "08:15",
  "status": "AVAILABLE"
}
```

---

## 11.2. Lock slot

```http
POST /api/appointment-slots/{slotId}/lock
```

Role:

```text
PATIENT, RECEPTIONIST
```

Request:

```json
{
  "patientId": 1
}
```

Response:

```json
{
  "slotId": 1,
  "status": "LOCKED",
  "lockedUntil": "2026-05-20T07:55:00"
}
```

---

## 11.3. Release slot

```http
POST /api/appointment-slots/{slotId}/release
```

Role:

```text
PATIENT, RECEPTIONIST, ADMIN
```

---

# 12. Doctor Leave Request API

## 12.1. Get leave requests

```http
GET /api/doctor-leave-requests
```

Role:

```text
ADMIN, DOCTOR_OWNER
```

Query params:

```text
?doctorId=1&status=PENDING
```

---

## 12.2. Create leave request

```http
POST /api/doctor-leave-requests
```

Role:

```text
DOCTOR
```

Request:

```json
{
  "requestType": "LEAVE",
  "fromDatetime": "2026-05-20T08:00:00",
  "toDatetime": "2026-05-20T11:00:00",
  "reason": "Personal reason"
}
```

---

## 12.3. Approve leave request

```http
PUT /api/doctor-leave-requests/{requestId}/approve
```

Role:

```text
ADMIN
```

---

## 12.4. Reject leave request

```http
PUT /api/doctor-leave-requests/{requestId}/reject
```

Role:

```text
ADMIN
```

Request:

```json
{
  "reason": "Schedule is full"
}
```

---

# 13. Appointment API

## 13.1. Get appointments

```http
GET /api/appointments
```

Role:

```text
ADMIN, RECEPTIONIST, DOCTOR, PATIENT_OWNER
```

Query params:

```text
?page=0&size=10&patientId=1&doctorId=1&date=2026-05-20&status=CONFIRMED
```

Response item:

```json
{
  "appointmentId": 1,
  "appointmentCode": "APT000001",
  "patientId": 1,
  "patientName": "Nguyen Van A",
  "doctorId": 1,
  "doctorName": "Dr. Tran Van B",
  "departmentId": 1,
  "departmentName": "Cardiology",
  "appointmentDate": "2026-05-20",
  "startTime": "08:00",
  "endTime": "08:15",
  "bookingType": "ONLINE",
  "status": "CONFIRMED"
}
```

---

## 13.2. Get appointment by id

```http
GET /api/appointments/{appointmentId}
```

Role:

```text
ADMIN, RECEPTIONIST, DOCTOR, PATIENT_OWNER
```

---

## 13.3. Create appointment

```http
POST /api/appointments
```

Role:

```text
PATIENT, RECEPTIONIST
```

Request:

```json
{
  "patientId": 1,
  "doctorId": 1,
  "departmentId": 1,
  "slotId": 1,
  "bookingType": "ONLINE",
  "reasonForVisit": "Headache",
  "initialSymptoms": "Fever and headache"
}
```

Response:

```json
{
  "appointmentId": 1,
  "appointmentCode": "APT000001",
  "status": "PENDING_PAYMENT",
  "depositAmount": 50000
}
```

---

## 13.4. Create walk-in appointment

```http
POST /api/appointments/walk-in
```

Role:

```text
RECEPTIONIST
```

Request:

```json
{
  "patientId": 1,
  "doctorId": 1,
  "departmentId": 1,
  "reasonForVisit": "Cough",
  "initialSymptoms": "Cough and sore throat"
}
```

Response:

```json
{
  "appointmentId": 2,
  "appointmentCode": "APT000002",
  "status": "CONFIRMED"
}
```

---

## 13.5. Cancel appointment

```http
PUT /api/appointments/{appointmentId}/cancel
```

Role:

```text
PATIENT_OWNER, RECEPTIONIST, ADMIN
```

Request:

```json
{
  "reason": "Patient cannot come"
}
```

---

## 13.6. Reschedule appointment

```http
PUT /api/appointments/{appointmentId}/reschedule
```

Role:

```text
PATIENT_OWNER, RECEPTIONIST
```

Request:

```json
{
  "newSlotId": 10,
  "reason": "Change suitable time"
}
```

Response:

```json
{
  "oldAppointmentId": 1,
  "newAppointmentId": 3,
  "status": "RESCHEDULED"
}
```

---

## 13.7. Check-in appointment

```http
PUT /api/appointments/{appointmentId}/check-in
```

Role:

```text
RECEPTIONIST
```

Response:

```json
{
  "appointmentId": 1,
  "status": "CHECKED_IN",
  "queueTicketId": 1,
  "queueNumber": 5
}
```

---

## 13.8. Mark no-show

```http
PUT /api/appointments/{appointmentId}/no-show
```

Role:

```text
RECEPTIONIST, ADMIN
```

---

## 13.9. Get my appointments

```http
GET /api/appointments/me
```

Role:

```text
PATIENT
```

---

## 13.10. Get doctor appointments today

```http
GET /api/appointments/doctor/today
```

Role:

```text
DOCTOR
```

---

# 14. Queue API

## 14.1. Get queue tickets

```http
GET /api/queue-tickets
```

Role:

```text
RECEPTIONIST, DOCTOR, ADMIN
```

Query params:

```text
?doctorId=1&departmentId=1&date=2026-05-20&status=WAITING
```

---

## 14.2. Get queue ticket by id

```http
GET /api/queue-tickets/{queueTicketId}
```

Role:

```text
RECEPTIONIST, DOCTOR, ADMIN, PATIENT_OWNER
```

---

## 14.3. Call next patient

```http
PUT /api/queue-tickets/{queueTicketId}/call
```

Role:

```text
DOCTOR, RECEPTIONIST
```

---

## 14.4. Start examination from queue

```http
PUT /api/queue-tickets/{queueTicketId}/start-examination
```

Role:

```text
DOCTOR
```

Response:

```json
{
  "queueTicketId": 1,
  "status": "IN_EXAMINATION",
  "consultationId": 1
}
```

---

## 14.5. Mark queue ticket done

```http
PUT /api/queue-tickets/{queueTicketId}/done
```

Role:

```text
DOCTOR, RECEPTIONIST
```

---

## 14.6. Skip queue ticket

```http
PUT /api/queue-tickets/{queueTicketId}/skip
```

Role:

```text
RECEPTIONIST, DOCTOR
```

Request:

```json
{
  "reason": "Patient not present"
}
```

---

## 14.7. Get my queue status

```http
GET /api/queue-tickets/me/current
```

Role:

```text
PATIENT
```

Response:

```json
{
  "queueNumber": 5,
  "currentNumber": 3,
  "estimatedWaitMinutes": 20,
  "status": "WAITING"
}
```

---

# 15. Consultation API

## 15.1. Get consultations

```http
GET /api/consultations
```

Role:

```text
ADMIN, DOCTOR, RECEPTIONIST
```

Query params:

```text
?patientId=1&doctorId=1&status=IN_PROGRESS
```

---

## 15.2. Get consultation by id

```http
GET /api/consultations/{consultationId}
```

Role:

```text
ADMIN, DOCTOR_OWNER, PATIENT_OWNER
```

---

## 15.3. Create consultation

```http
POST /api/consultations
```

Role:

```text
DOCTOR
```

Request:

```json
{
  "appointmentId": 1
}
```

---

## 15.4. Start consultation

```http
PUT /api/consultations/{consultationId}/start
```

Role:

```text
DOCTOR_OWNER
```

---

## 15.5. Complete consultation

```http
PUT /api/consultations/{consultationId}/complete
```

Role:

```text
DOCTOR_OWNER
```

---

## 15.6. Change consultation status

```http
PUT /api/consultations/{consultationId}/status
```

Role:

```text
DOCTOR_OWNER
```

Request:

```json
{
  "status": "WAITING_LAB_RESULT"
}
```

---

# 16. Medical Record API

## 16.1. Get medical records

```http
GET /api/medical-records
```

Role:

```text
ADMIN, DOCTOR, PATIENT_OWNER
```

Query params:

```text
?patientId=1&doctorId=1
```

---

## 16.2. Get medical record by id

```http
GET /api/medical-records/{medicalRecordId}
```

Role:

```text
ADMIN, DOCTOR_OWNER, PATIENT_OWNER
```

---

## 16.3. Create medical record

```http
POST /api/medical-records
```

Role:

```text
DOCTOR_OWNER
```

Request:

```json
{
  "consultationId": 1,
  "symptoms": "Fever, headache",
  "clinicalFindings": "Body temperature 38.5",
  "diagnosis": "Viral fever",
  "treatmentPlan": "Rest and drink water",
  "doctorNote": "Follow up if fever continues",
  "followUpDate": "2026-05-27",
  "followUpNote": "Re-check after 7 days"
}
```

---

## 16.4. Update medical record

```http
PUT /api/medical-records/{medicalRecordId}
```

Role:

```text
DOCTOR_OWNER
```

---

## 16.5. Get patient medical history

```http
GET /api/patients/{patientId}/medical-history
```

Role:

```text
ADMIN, DOCTOR, PATIENT_OWNER
```

---

# 17. Vital Signs API

## 17.1. Create vital signs

```http
POST /api/vital-signs
```

Role:

```text
DOCTOR, RECEPTIONIST
```

Request:

```json
{
  "consultationId": 1,
  "patientId": 1,
  "heightCm": 170,
  "weightKg": 65,
  "temperatureC": 38.5,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 90,
  "respiratoryRate": 18,
  "spo2": 98
}
```

---

## 17.2. Get vital signs by consultation

```http
GET /api/consultations/{consultationId}/vital-signs
```

Role:

```text
ADMIN, DOCTOR_OWNER, PATIENT_OWNER
```

---

# 18. Lab Test API

## 18.1. Get lab tests

```http
GET /api/lab-tests
```

Role:

```text
ADMIN, DOCTOR, LAB_TECHNICIAN, RECEPTIONIST
```

Query params:

```text
?status=ACTIVE&keyword=blood
```

---

## 18.2. Get lab test by id

```http
GET /api/lab-tests/{labTestId}
```

Role:

```text
ADMIN, DOCTOR, LAB_TECHNICIAN, RECEPTIONIST
```

---

## 18.3. Create lab test

```http
POST /api/lab-tests
```

Role:

```text
ADMIN
```

Request:

```json
{
  "testCode": "LAB001",
  "testName": "Complete Blood Count",
  "description": "Blood test",
  "price": 150000
}
```

---

## 18.4. Update lab test

```http
PUT /api/lab-tests/{labTestId}
```

Role:

```text
ADMIN
```

---

## 18.5. Delete lab test

```http
DELETE /api/lab-tests/{labTestId}
```

Role:

```text
ADMIN
```

---

# 19. Lab Request API

## 19.1. Get lab requests

```http
GET /api/lab-requests
```

Role:

```text
ADMIN, DOCTOR, LAB_TECHNICIAN
```

Query params:

```text
?patientId=1&doctorId=1&status=REQUESTED
```

---

## 19.2. Get lab request by id

```http
GET /api/lab-requests/{labRequestId}
```

Role:

```text
ADMIN, DOCTOR_OWNER, LAB_TECHNICIAN, PATIENT_OWNER
```

---

## 19.3. Create lab request

```http
POST /api/lab-requests
```

Role:

```text
DOCTOR_OWNER
```

Request:

```json
{
  "consultationId": 1,
  "note": "Need blood test",
  "labTestIds": [1, 2, 3]
}
```

Response:

```json
{
  "labRequestId": 1,
  "requestCode": "LABREQ000001",
  "status": "REQUESTED"
}
```

---

## 19.4. Accept lab request

```http
PUT /api/lab-requests/{labRequestId}/accept
```

Role:

```text
LAB_TECHNICIAN
```

---

## 19.5. Update lab request status

```http
PUT /api/lab-requests/{labRequestId}/status
```

Role:

```text
LAB_TECHNICIAN
```

Request:

```json
{
  "status": "IN_PROGRESS"
}
```

---

## 19.6. Cancel lab request

```http
PUT /api/lab-requests/{labRequestId}/cancel
```

Role:

```text
DOCTOR_OWNER, ADMIN
```

Request:

```json
{
  "reason": "Not necessary"
}
```

---

# 20. Lab Result API

## 20.1. Create lab result

```http
POST /api/lab-results
```

Role:

```text
LAB_TECHNICIAN
```

Request:

```json
{
  "labRequestItemId": 1,
  "resultValue": "Normal",
  "normalRange": "4.0 - 10.0",
  "resultUnit": "10^9/L",
  "conclusion": "Normal result",
  "resultFileUrl": "https://example.com/result.pdf"
}
```

---

## 20.2. Update lab result

```http
PUT /api/lab-results/{labResultId}
```

Role:

```text
LAB_TECHNICIAN
```

---

## 20.3. Get lab results by request

```http
GET /api/lab-requests/{labRequestId}/results
```

Role:

```text
ADMIN, DOCTOR_OWNER, LAB_TECHNICIAN, PATIENT_OWNER
```

---

## 20.4. Get patient lab results

```http
GET /api/patients/{patientId}/lab-results
```

Role:

```text
ADMIN, DOCTOR, PATIENT_OWNER
```

---

# 21. Medical Service API

## 21.1. Get medical services

```http
GET /api/medical-services
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?serviceType=CONSULTATION&status=ACTIVE
```

---

## 21.2. Create medical service

```http
POST /api/medical-services
```

Role:

```text
ADMIN
```

Request:

```json
{
  "serviceCode": "SVC001",
  "serviceName": "General Consultation",
  "serviceType": "CONSULTATION",
  "price": 200000,
  "description": "General doctor consultation"
}
```

---

## 21.3. Update medical service

```http
PUT /api/medical-services/{serviceId}
```

Role:

```text
ADMIN
```

---

## 21.4. Delete medical service

```http
DELETE /api/medical-services/{serviceId}
```

Role:

```text
ADMIN
```

---

# 22. Medicine API

## 22.1. Get medicines

```http
GET /api/medicines
```

Role:

```text
ADMIN, DOCTOR, PHARMACIST
```

Query params:

```text
?page=0&size=10&keyword=para&status=ACTIVE
```

Response item:

```json
{
  "medicineId": 1,
  "medicineCode": "MED001",
  "medicineName": "Paracetamol",
  "activeIngredient": "Paracetamol",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "unit": "tablet",
  "status": "ACTIVE"
}
```

---

## 22.2. Get medicine by id

```http
GET /api/medicines/{medicineId}
```

Role:

```text
ADMIN, DOCTOR, PHARMACIST
```

---

## 22.3. Create medicine

```http
POST /api/medicines
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "medicineCode": "MED001",
  "medicineName": "Paracetamol",
  "activeIngredient": "Paracetamol",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "unit": "tablet",
  "rxnormCode": "123456",
  "description": "Pain reliever"
}
```

---

## 22.4. Update medicine

```http
PUT /api/medicines/{medicineId}
```

Role:

```text
ADMIN, PHARMACIST
```

---

## 22.5. Delete medicine

```http
DELETE /api/medicines/{medicineId}
```

Role:

```text
ADMIN, PHARMACIST
```

---

# 23. Prescription API

## 23.1. Get prescriptions

```http
GET /api/prescriptions
```

Role:

```text
ADMIN, DOCTOR, PHARMACIST, PATIENT_OWNER
```

Query params:

```text
?patientId=1&doctorId=1&status=CREATED
```

---

## 23.2. Get prescription by id

```http
GET /api/prescriptions/{prescriptionId}
```

Role:

```text
ADMIN, DOCTOR_OWNER, PHARMACIST, PATIENT_OWNER
```

---

## 23.3. Create prescription

```http
POST /api/prescriptions
```

Role:

```text
DOCTOR_OWNER
```

Request:

```json
{
  "consultationId": 1,
  "doctorNote": "Take medicine after meals",
  "items": [
    {
      "medicineId": 1,
      "quantity": 10,
      "dosage": "1 tablet",
      "frequency": "2 times per day",
      "duration": "5 days",
      "instructions": "After meals",
      "morningDose": "1",
      "noonDose": "0",
      "eveningDose": "1",
      "nightDose": "0"
    }
  ]
}
```

Response:

```json
{
  "prescriptionId": 1,
  "prescriptionCode": "PRE000001",
  "status": "CREATED"
}
```

---

## 23.4. Add item to prescription

```http
POST /api/prescriptions/{prescriptionId}/items
```

Role:

```text
DOCTOR_OWNER
```

---

## 23.5. Update prescription item

```http
PUT /api/prescriptions/{prescriptionId}/items/{itemId}
```

Role:

```text
DOCTOR_OWNER
```

---

## 23.6. Delete prescription item

```http
DELETE /api/prescriptions/{prescriptionId}/items/{itemId}
```

Role:

```text
DOCTOR_OWNER
```

---

## 23.7. Check drug interaction

```http
POST /api/prescriptions/{prescriptionId}/check-interactions
```

Role:

```text
DOCTOR_OWNER
```

Response:

```json
{
  "prescriptionId": 1,
  "checked": true,
  "warningLevel": "LOW",
  "warningMessage": "No severe interaction found"
}
```

---

## 23.8. Dispense prescription

```http
PUT /api/prescriptions/{prescriptionId}/dispense
```

Role:

```text
PHARMACIST
```

Response:

```json
{
  "prescriptionId": 1,
  "status": "DISPENSED"
}
```

---

## 23.9. Cancel prescription

```http
PUT /api/prescriptions/{prescriptionId}/cancel
```

Role:

```text
DOCTOR_OWNER, ADMIN
```

---

## 23.10. Get my prescriptions

```http
GET /api/prescriptions/me
```

Role:

```text
PATIENT
```

---

# 24. Supplier API

## 24.1. Get suppliers

```http
GET /api/suppliers
```

Role:

```text
ADMIN, PHARMACIST
```

---

## 24.2. Create supplier

```http
POST /api/suppliers
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "supplierName": "ABC Pharma",
  "phone": "0909000000",
  "email": "abc@pharma.com",
  "address": "Ho Chi Minh City"
}
```

---

## 24.3. Update supplier

```http
PUT /api/suppliers/{supplierId}
```

Role:

```text
ADMIN, PHARMACIST
```

---

## 24.4. Delete supplier

```http
DELETE /api/suppliers/{supplierId}
```

Role:

```text
ADMIN, PHARMACIST
```

---

# 25. Medicine Batch API

## 25.1. Get medicine batches

```http
GET /api/medicine-batches
```

Role:

```text
ADMIN, PHARMACIST
```

Query params:

```text
?medicineId=1&status=AVAILABLE&nearExpiry=true
```

---

## 25.2. Create medicine batch

```http
POST /api/medicine-batches
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "medicineId": 1,
  "supplierId": 1,
  "batchNumber": "BATCH001",
  "manufactureDate": "2026-01-01",
  "expiryDate": "2028-01-01",
  "importPrice": 1000,
  "sellingPrice": 2000,
  "initialQuantity": 1000,
  "currentQuantity": 1000
}
```

---

## 25.3. Update medicine batch

```http
PUT /api/medicine-batches/{batchId}
```

Role:

```text
ADMIN, PHARMACIST
```

---

## 25.4. Get medicine stock summary

```http
GET /api/medicines/{medicineId}/stock-summary
```

Role:

```text
ADMIN, PHARMACIST, DOCTOR
```

Response:

```json
{
  "medicineId": 1,
  "medicineName": "Paracetamol",
  "totalQuantity": 1000,
  "availableBatches": 2,
  "nearExpiryBatches": 0
}
```

---

# 26. Stock Transaction API

## 26.1. Get stock transactions

```http
GET /api/stock-transactions
```

Role:

```text
ADMIN, PHARMACIST
```

Query params:

```text
?medicineId=1&transactionType=IMPORT&fromDate=2026-01-01&toDate=2026-05-20
```

---

## 26.2. Import stock

```http
POST /api/stock-transactions/import
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "medicineId": 1,
  "batchId": 1,
  "quantity": 100,
  "note": "Import additional stock"
}
```

---

## 26.3. Export stock manually

```http
POST /api/stock-transactions/export
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "medicineId": 1,
  "batchId": 1,
  "quantity": 10,
  "referenceType": "MANUAL",
  "note": "Manual export"
}
```

---

## 26.4. Adjust stock

```http
POST /api/stock-transactions/adjust
```

Role:

```text
ADMIN, PHARMACIST
```

Request:

```json
{
  "medicineId": 1,
  "batchId": 1,
  "quantity": 5,
  "adjustmentType": "INCREASE",
  "note": "Stock correction"
}
```

---

# 27. Stock Alert API

## 27.1. Get stock alerts

```http
GET /api/stock-alerts
```

Role:

```text
ADMIN, PHARMACIST
```

Query params:

```text
?alertType=LOW_STOCK&isResolved=false
```

---

## 27.2. Resolve stock alert

```http
PUT /api/stock-alerts/{alertId}/resolve
```

Role:

```text
ADMIN, PHARMACIST
```

---

## 27.3. Generate stock alerts

```http
POST /api/stock-alerts/generate
```

Role:

```text
ADMIN, PHARMACIST
```

Response:

```json
{
  "generatedAlerts": 5
}
```

---

# 28. Invoice API

## 28.1. Get invoices

```http
GET /api/invoices
```

Role:

```text
ADMIN, RECEPTIONIST, PATIENT_OWNER
```

Query params:

```text
?patientId=1&appointmentId=1&status=UNPAID
```

---

## 28.2. Get invoice by id

```http
GET /api/invoices/{invoiceId}
```

Role:

```text
ADMIN, RECEPTIONIST, PATIENT_OWNER
```

---

## 28.3. Create invoice

```http
POST /api/invoices
```

Role:

```text
RECEPTIONIST, ADMIN
```

Request:

```json
{
  "patientId": 1,
  "appointmentId": 1,
  "items": [
    {
      "itemType": "CONSULTATION",
      "referenceId": 1,
      "itemName": "General Consultation",
      "quantity": 1,
      "unitPrice": 200000
    },
    {
      "itemType": "LAB_TEST",
      "referenceId": 1,
      "itemName": "Blood Test",
      "quantity": 1,
      "unitPrice": 150000
    }
  ],
  "discountAmount": 0
}
```

Response:

```json
{
  "invoiceId": 1,
  "invoiceCode": "INV000001",
  "totalAmount": 350000,
  "discountAmount": 0,
  "finalAmount": 350000,
  "status": "UNPAID"
}
```

---

## 28.4. Update invoice

```http
PUT /api/invoices/{invoiceId}
```

Role:

```text
RECEPTIONIST, ADMIN
```

---

## 28.5. Cancel invoice

```http
PUT /api/invoices/{invoiceId}/cancel
```

Role:

```text
RECEPTIONIST, ADMIN
```

---

## 28.6. Get my invoices

```http
GET /api/invoices/me
```

Role:

```text
PATIENT
```

---

# 29. Payment API

## 29.1. Get payments

```http
GET /api/payments
```

Role:

```text
ADMIN, RECEPTIONIST, PATIENT_OWNER
```

Query params:

```text
?invoiceId=1&appointmentId=1&status=PAID
```

---

## 29.2. Create payment

```http
POST /api/payments
```

Role:

```text
PATIENT, RECEPTIONIST
```

Request:

```json
{
  "invoiceId": 1,
  "appointmentId": 1,
  "paymentType": "FINAL_PAYMENT",
  "paymentMethod": "CASH",
  "amount": 350000
}
```

Response:

```json
{
  "paymentId": 1,
  "paymentCode": "PAY000001",
  "status": "PENDING"
}
```

---

## 29.3. Confirm cash payment

```http
PUT /api/payments/{paymentId}/confirm-cash
```

Role:

```text
RECEPTIONIST
```

Response:

```json
{
  "paymentId": 1,
  "status": "PAID"
}
```

---

## 29.4. Create online payment URL

```http
POST /api/payments/online/create-url
```

Role:

```text
PATIENT
```

Request:

```json
{
  "invoiceId": 1,
  "appointmentId": 1,
  "amount": 350000,
  "returnUrl": "https://example.com/payment-return"
}
```

Response:

```json
{
  "paymentId": 1,
  "paymentUrl": "https://payment-gateway.com/pay/abc"
}
```

---

## 29.5. Online payment callback

```http
POST /api/payments/online/callback
```

Role:

```text
PAYMENT_GATEWAY
```

Request:

```json
{
  "gatewayTransactionId": "GW123456",
  "paymentCode": "PAY000001",
  "status": "PAID",
  "amount": 350000
}
```

---

## 29.6. Get payment by id

```http
GET /api/payments/{paymentId}
```

Role:

```text
ADMIN, RECEPTIONIST, PATIENT_OWNER
```

---

# 30. Refund API

## 30.1. Get refunds

```http
GET /api/refunds
```

Role:

```text
ADMIN, RECEPTIONIST
```

Query params:

```text
?status=PENDING
```

---

## 30.2. Create refund request

```http
POST /api/refunds
```

Role:

```text
PATIENT, RECEPTIONIST
```

Request:

```json
{
  "paymentId": 1,
  "refundAmount": 50000,
  "reason": "Appointment cancelled"
}
```

---

## 30.3. Approve refund

```http
PUT /api/refunds/{refundId}/approve
```

Role:

```text
ADMIN
```

---

## 30.4. Reject refund

```http
PUT /api/refunds/{refundId}/reject
```

Role:

```text
ADMIN
```

Request:

```json
{
  "reason": "Invalid refund condition"
}
```

---

## 30.5. Complete refund

```http
PUT /api/refunds/{refundId}/complete
```

Role:

```text
ADMIN, RECEPTIONIST
```

---

# 31. AI Chat API

## 31.1. Create AI chat session

```http
POST /api/ai/chat-sessions
```

Role:

```text
PATIENT
```

Request:

```json
{
  "sessionType": "SYMPTOM_CHECK"
}
```

Response:

```json
{
  "aiChatSessionId": 1,
  "sessionType": "SYMPTOM_CHECK"
}
```

---

## 31.2. Send message to AI

```http
POST /api/ai/chat-sessions/{sessionId}/messages
```

Role:

```text
PATIENT
```

Request:

```json
{
  "messageText": "I have fever and headache"
}
```

Response:

```json
{
  "patientMessage": {
    "messageId": 1,
    "messageText": "I have fever and headache"
  },
  "aiMessage": {
    "messageId": 2,
    "messageText": "Based on your symptoms, you may consider Internal Medicine. This is only a suggestion, not a diagnosis."
  }
}
```

---

## 31.3. Get AI chat messages

```http
GET /api/ai/chat-sessions/{sessionId}/messages
```

Role:

```text
PATIENT_OWNER, ADMIN
```

---

## 31.4. Generate specialty suggestion

```http
POST /api/ai/chat-sessions/{sessionId}/specialty-suggestion
```

Role:

```text
PATIENT
```

Response:

```json
{
  "suggestionId": 1,
  "departmentId": 1,
  "departmentName": "Internal Medicine",
  "confidenceScore": 85,
  "explanation": "Suggested based on fever and headache"
}
```

---

## 31.5. Accept specialty suggestion

```http
PUT /api/ai/specialty-suggestions/{suggestionId}/accept
```

Role:

```text
PATIENT_OWNER
```

---

# 32. AI Voice Transcription API

## 32.1. Create voice transcription

```http
POST /api/ai/voice-transcriptions
```

Role:

```text
DOCTOR_OWNER
```

Content type:

```text
multipart/form-data
```

Request fields:

```text
consultationId: 1
audioFile: file
```

Response:

```json
{
  "transcriptionId": 1,
  "transcriptText": "Patient has fever for two days",
  "aiProcessedText": "Symptoms: fever for two days"
}
```

---

## 32.2. Get transcription by consultation

```http
GET /api/consultations/{consultationId}/voice-transcriptions
```

Role:

```text
DOCTOR_OWNER
```

---

# 33. Notification API

## 33.1. Get my notifications

```http
GET /api/notifications/me
```

Role:

```text
AUTHENTICATED
```

Query params:

```text
?isRead=false
```

---

## 33.2. Mark notification as read

```http
PUT /api/notifications/{notificationId}/read
```

Role:

```text
NOTIFICATION_OWNER
```

---

## 33.3. Mark all notifications as read

```http
PUT /api/notifications/me/read-all
```

Role:

```text
AUTHENTICATED
```

---

## 33.4. Create notification

```http
POST /api/notifications
```

Role:

```text
ADMIN
```

Request:

```json
{
  "userId": 1,
  "title": "Appointment Reminder",
  "message": "You have an appointment tomorrow",
  "notificationType": "APPOINTMENT_REMINDER",
  "relatedType": "APPOINTMENT",
  "relatedId": 1
}
```

---

# 34. Review API

## 34.1. Get reviews

```http
GET /api/reviews
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?doctorId=1&rating=5
```

---

## 34.2. Create review

```http
POST /api/reviews
```

Role:

```text
PATIENT
```

Request:

```json
{
  "doctorId": 1,
  "appointmentId": 1,
  "rating": 5,
  "comment": "Good doctor"
}
```

---

## 34.3. Update review

```http
PUT /api/reviews/{reviewId}
```

Role:

```text
REVIEW_OWNER
```

---

## 34.4. Hide review

```http
PUT /api/reviews/{reviewId}/hide
```

Role:

```text
ADMIN
```

---

## 34.5. Delete review

```http
DELETE /api/reviews/{reviewId}
```

Role:

```text
ADMIN, REVIEW_OWNER
```

---

# 35. Article API

## 35.1. Get published articles

```http
GET /api/articles
```

Role:

```text
PUBLIC, AUTHENTICATED
```

Query params:

```text
?page=0&size=10&keyword=health&status=PUBLISHED
```

---

## 35.2. Get article by id

```http
GET /api/articles/{articleId}
```

Role:

```text
PUBLIC, AUTHENTICATED
```

---

## 35.3. Get article by slug

```http
GET /api/articles/slug/{slug}
```

Role:

```text
PUBLIC, AUTHENTICATED
```

---

## 35.4. Create article

```http
POST /api/articles
```

Role:

```text
ADMIN
```

Request:

```json
{
  "title": "How to prevent flu",
  "slug": "how-to-prevent-flu",
  "content": "Article content",
  "thumbnailUrl": "https://example.com/image.jpg",
  "status": "DRAFT"
}
```

---

## 35.5. Update article

```http
PUT /api/articles/{articleId}
```

Role:

```text
ADMIN
```

---

## 35.6. Publish article

```http
PUT /api/articles/{articleId}/publish
```

Role:

```text
ADMIN
```

---

## 35.7. Archive article

```http
PUT /api/articles/{articleId}/archive
```

Role:

```text
ADMIN
```

---

## 35.8. Delete article

```http
DELETE /api/articles/{articleId}
```

Role:

```text
ADMIN
```

---

# 36. Audit Log API

## 36.1. Get audit logs

```http
GET /api/audit-logs
```

Role:

```text
ADMIN
```

Query params:

```text
?page=0&size=10&userId=1&action=UPDATE&tableName=patients
```

---

## 36.2. Get audit log by id

```http
GET /api/audit-logs/{auditLogId}
```

Role:

```text
ADMIN
```

---

# 37. System Setting API

## 37.1. Get system settings

```http
GET /api/system-settings
```

Role:

```text
ADMIN
```

---

## 37.2. Get setting by key

```http
GET /api/system-settings/{settingKey}
```

Role:

```text
ADMIN
```

---

## 37.3. Create or update setting

```http
PUT /api/system-settings/{settingKey}
```

Role:

```text
ADMIN
```

Request:

```json
{
  "settingValue": "50000",
  "description": "Appointment deposit amount"
}
```

---

## 37.4. Delete setting

```http
DELETE /api/system-settings/{settingKey}
```

Role:

```text
ADMIN
```

---

# 38. Report API

## 38.1. Revenue report

```http
GET /api/reports/revenue
```

Role:

```text
ADMIN
```

Query params:

```text
?fromDate=2026-05-01&toDate=2026-05-31&groupBy=DAY
```

Response:

```json
{
  "totalRevenue": 10000000,
  "items": [
    {
      "date": "2026-05-01",
      "revenue": 1000000
    }
  ]
}
```

---

## 38.2. Appointment report

```http
GET /api/reports/appointments
```

Role:

```text
ADMIN
```

Query params:

```text
?fromDate=2026-05-01&toDate=2026-05-31
```

Response:

```json
{
  "totalAppointments": 100,
  "completed": 80,
  "cancelled": 10,
  "noShow": 5,
  "rescheduled": 5
}
```

---

## 38.3. Doctor performance report

```http
GET /api/reports/doctors
```

Role:

```text
ADMIN
```

Query params:

```text
?fromDate=2026-05-01&toDate=2026-05-31&doctorId=1
```

Response:

```json
{
  "doctorId": 1,
  "doctorName": "Dr. Nguyen Van B",
  "totalConsultations": 50,
  "averageRating": 4.8,
  "revenue": 5000000
}
```

---

## 38.4. Medicine stock report

```http
GET /api/reports/medicine-stock
```

Role:

```text
ADMIN, PHARMACIST
```

Response item:

```json
{
  "medicineId": 1,
  "medicineName": "Paracetamol",
  "totalQuantity": 1000,
  "lowStock": false,
  "nearExpiry": false
}
```

---

# 39. File Upload API

## 39.1. Upload file

```http
POST /api/files/upload
```

Role:

```text
AUTHENTICATED
```

Content type:

```text
multipart/form-data
```

Request fields:

```text
file: file
folder: lab-results
```

Response:

```json
{
  "fileUrl": "https://example.com/uploads/lab-results/result.pdf",
  "fileName": "result.pdf",
  "contentType": "application/pdf",
  "size": 102400
}
```

---

# 40. API chia theo người làm

## Người 1 — Auth, User, Role, Security, Admin core

Phụ trách:

```text
Auth API
User API
Role API
Permission API
Audit Log API
System Setting API
```

Endpoint chính:

```text
/api/auth/**
/api/users/**
/api/roles/**
/api/permissions/**
/api/audit-logs/**
/api/system-settings/**
```

---

## Người 2 — Patient, Doctor, Department, Staff

Phụ trách:

```text
Patient API
Doctor API
Department API
Staff API
```

Endpoint chính:

```text
/api/patients/**
/api/doctors/**
/api/departments/**
/api/staff/**
```

---

## Người 3 — Schedule, Appointment, Queue, Notification

Phụ trách:

```text
Doctor Schedule API
Appointment Slot API
Doctor Leave Request API
Appointment API
Queue API
Notification API
```

Endpoint chính:

```text
/api/doctor-schedules/**
/api/appointment-slots/**
/api/doctor-leave-requests/**
/api/appointments/**
/api/queue-tickets/**
/api/notifications/**
```

---

## Người 4 — Consultation, Medical Record, Lab, Prescription

Phụ trách:

```text
Consultation API
Medical Record API
Vital Signs API
Lab Test API
Lab Request API
Lab Result API
Prescription API
```

Endpoint chính:

```text
/api/consultations/**
/api/medical-records/**
/api/vital-signs/**
/api/lab-tests/**
/api/lab-requests/**
/api/lab-results/**
/api/prescriptions/**
```

---

## Người 5 — Payment, Inventory, AI, Review, Article, Report

Phụ trách:

```text
Medical Service API
Medicine API
Supplier API
Medicine Batch API
Stock Transaction API
Stock Alert API
Invoice API
Payment API
Refund API
AI Chat API
AI Voice API
Review API
Article API
Report API
File Upload API
```

Endpoint chính:

```text
/api/medical-services/**
/api/medicines/**
/api/suppliers/**
/api/medicine-batches/**
/api/stock-transactions/**
/api/stock-alerts/**
/api/invoices/**
/api/payments/**
/api/refunds/**
/api/ai/**
/api/reviews/**
/api/articles/**
/api/reports/**
/api/files/**
```

---

# 41. Core end-to-end flow cần test

## 41.1. Flow đặt lịch online

```text
POST /api/auth/register
GET  /api/departments
GET  /api/doctors?departmentId=1
GET  /api/appointment-slots/available?doctorId=1&date=2026-05-20
POST /api/appointment-slots/{slotId}/lock
POST /api/appointments
POST /api/payments/online/create-url
POST /api/payments/online/callback
GET  /api/appointments/me
```

---

## 41.2. Flow tiếp đón

```text
GET /api/appointments?status=CONFIRMED&date=2026-05-20
PUT /api/appointments/{appointmentId}/check-in
GET /api/queue-tickets?doctorId=1&status=WAITING
```

---

## 41.3. Flow khám bệnh

```text
PUT  /api/queue-tickets/{queueTicketId}/call
PUT  /api/queue-tickets/{queueTicketId}/start-examination
PUT  /api/consultations/{consultationId}/start
POST /api/vital-signs
POST /api/medical-records
POST /api/lab-requests
POST /api/prescriptions
POST /api/prescriptions/{prescriptionId}/check-interactions
PUT  /api/consultations/{consultationId}/complete
```

---

## 41.4. Flow xét nghiệm

```text
GET  /api/lab-requests?status=REQUESTED
PUT  /api/lab-requests/{labRequestId}/accept
PUT  /api/lab-requests/{labRequestId}/status
POST /api/lab-results
GET  /api/lab-requests/{labRequestId}/results
```

---

## 41.5. Flow thanh toán cuối

```text
POST /api/invoices
POST /api/payments
PUT  /api/payments/{paymentId}/confirm-cash
GET  /api/invoices/{invoiceId}
```

---

## 41.6. Flow cấp phát thuốc

```text
GET /api/prescriptions?status=CHECKED
PUT /api/prescriptions/{prescriptionId}/dispense
POST /api/stock-transactions/export
GET /api/medicines/{medicineId}/stock-summary
```

---

# 42. Ghi chú triển khai

## 42.1. Không nên trả Entity trực tiếp

Backend nên dùng DTO:

```text
UserRequest
UserResponse
PatientRequest
PatientResponse
AppointmentRequest
AppointmentResponse
```

Không nên return thẳng Entity vì dễ lộ field nhạy cảm như `passwordHash`.

---

## 42.2. Quy tắc đặt tên DTO

```text
CreatePatientRequest
UpdatePatientRequest
PatientResponse
PatientDetailResponse
AppointmentResponse
CreateAppointmentRequest
```

---

## 42.3. Quy tắc bảo mật

```text
PATIENT chỉ xem dữ liệu của chính mình.
DOCTOR chỉ xem bệnh nhân thuộc lịch khám / phiên khám của mình.
RECEPTIONIST được xem appointment, queue, invoice.
PHARMACIST được xem prescription và medicine stock.
LAB_TECHNICIAN được xem lab request và nhập lab result.
ADMIN được toàn quyền.
```

---

## 42.4. AI disclaimer

Mọi response từ AI liên quan triệu chứng phải có disclaimer:

```text
This is only a suggestion and not a medical diagnosis.
Final diagnosis must be made by a doctor.
```

---

# 43. Thứ tự code API đề xuất

```text
1. Auth API
2. User / Role / Permission API
3. Patient API
4. Department API
5. Doctor API
6. Staff API
7. Doctor Schedule API
8. Appointment Slot API
9. Appointment API
10. Queue API
11. Consultation API
12. Medical Record API
13. Vital Signs API
14. Lab API
15. Medicine API
16. Prescription API
17. Invoice API
18. Payment API
19. Inventory API
20. AI API
21. Notification API
22. Review API
23. Article API
24. Report API
```
