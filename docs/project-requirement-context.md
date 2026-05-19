# Project Requirement Context — AI Clinic Management System

## 1. Project Name

```text
AI Clinic Management System
Hệ thống Quản lý Phòng Khám Thông minh
```

---

## 2. Project Overview

This project is a web application for managing an outpatient clinic.

The system supports the full clinic workflow:

```text
Patient needs medical care
→ Online/offline appointment booking
→ Receptionist check-in
→ Queue management
→ Doctor consultation
→ Lab test request if needed
→ Medical record creation
→ Prescription
→ Invoice and payment
→ Medicine dispensing
→ Follow-up after consultation
```

The system also includes AI support features, but AI is only used as a support tool.

Important rule:

```text
AI must not replace doctors.
AI must not make final medical diagnoses.
Final diagnosis must always be created or confirmed by a doctor.
```

---

## 3. Main Goal

The goal of this project is to build a smart clinic management system that helps:

```text
Patients book appointments more easily.
Receptionists manage check-in and queues.
Doctors access patient records and create medical records faster.
Lab technicians manage lab requests and results.
Pharmacists manage prescriptions and medicine stock.
Admins manage users, roles, reports and system settings.
```

---

## 4. Target Users / Actors

The system has these main actors:

```text
Patient
Doctor
Receptionist
Admin
Pharmacist
Lab Technician
AI System
Payment Gateway
Drug Interaction API / RxNorm API
```

---

# 5. User Roles

## 5.1. Patient

Patient can:

```text
Register account
Login
Manage personal profile
Chat with AI about initial symptoms
Receive specialty suggestion from AI
View departments
View doctors
View available appointment slots
Book appointment
Pay appointment deposit
Cancel appointment
Reschedule appointment
Check appointment status
View queue number
View estimated waiting time
View medical records
View lab results
View prescriptions
View invoices
Review doctor or service
```

---

## 5.2. Doctor

Doctor can:

```text
View personal schedule
View today's appointments
View waiting patients
Start consultation
View patient medical history
Enter symptoms
Enter clinical findings
Enter diagnosis
Enter treatment plan
Request lab tests
View lab results
Create prescription
Check drug interaction warning
Complete consultation
Request leave or schedule change
```

---

## 5.3. Receptionist

Receptionist can:

```text
Search patient
Create patient profile for walk-in patient
Create offline appointment
Confirm check-in
Create queue ticket
Manage patient queue
Cancel or reschedule appointment on behalf of patient
Create invoice
Confirm cash payment
Check online payment status
Handle refund request
```

---

## 5.4. Admin

Admin can:

```text
Manage users
Manage roles and permissions
Manage doctors
Manage staff
Manage patients
Manage departments
Manage medical services
Manage doctor schedules
Approve doctor leave requests
View reports
View audit logs
Manage system settings
Manage articles
```

---

## 5.5. Pharmacist

Pharmacist can:

```text
Manage medicine catalog
Manage suppliers
Manage medicine batches
Import medicine stock
Export medicine stock
Dispense prescription
View stock summary
View stock alerts
Handle expired or near-expiry medicine
```

---

## 5.6. Lab Technician

Lab technician can:

```text
View lab requests
Accept lab requests
Update lab request status
Enter lab results
Attach lab result file URL
Send lab result to doctor
```

---

# 6. Main Business Workflow

## 6.1. Online Appointment Booking Flow

```text
1. Patient logs in.
2. Patient enters symptoms or chats with AI.
3. AI suggests a suitable department.
4. Patient chooses department.
5. System shows doctors and available slots.
6. Patient selects doctor and slot.
7. System locks the slot temporarily.
8. System creates appointment with status PENDING_PAYMENT.
9. Patient pays deposit.
10. Payment gateway returns result.
11. If payment is successful, appointment status becomes CONFIRMED.
12. System sends appointment confirmation notification.
```

---

## 6.2. Reception / Check-in Flow

```text
1. Patient arrives at clinic.
2. Receptionist searches appointment or patient profile.
3. If patient has appointment, receptionist confirms check-in.
4. If patient is walk-in, receptionist creates patient profile and appointment.
5. System creates queue ticket.
6. Patient status becomes WAITING.
7. Patient can track queue number and estimated waiting time.
```

---

## 6.3. Consultation Flow

```text
1. Doctor views waiting patient list.
2. Doctor calls patient from queue.
3. Doctor starts consultation.
4. System creates consultation session.
5. Doctor views patient history.
6. Doctor enters symptoms, findings, diagnosis and treatment plan.
7. Doctor requests lab tests if needed.
8. Doctor views lab results after completion.
9. Doctor creates prescription.
10. System checks drug interaction warning.
11. Doctor completes consultation.
12. Appointment status becomes COMPLETED.
```

---

## 6.4. Lab Flow

```text
1. Doctor creates lab request.
2. Lab technician views new request.
3. Lab technician accepts request.
4. Lab technician updates status to IN_PROGRESS.
5. Lab technician enters lab result.
6. Lab request status becomes COMPLETED.
7. Doctor views result and updates medical record if needed.
```

---

## 6.5. Payment and Medicine Dispensing Flow

```text
1. Receptionist creates invoice.
2. Patient pays by cash or online payment.
3. Payment status becomes PAID.
4. Invoice status becomes PAID.
5. Pharmacist views prescription.
6. Pharmacist dispenses medicine.
7. System exports medicine stock.
8. Prescription status becomes DISPENSED.
```

---

# 7. Main Modules

The project is divided into these modules:

```text
Auth
User
Role
Permission
Patient
Doctor
Department
Staff
Doctor Schedule
Appointment Slot
Appointment
Queue
Consultation
Medical Record
Vital Signs
Lab Test
Lab Request
Lab Result
Medical Service
Medicine
Prescription
Supplier
Medicine Batch
Stock Transaction
Stock Alert
Invoice
Payment
Refund
AI Chat
AI Voice Transcription
Notification
Review
Article
Audit Log
System Setting
Report
File Upload
```

---

# 8. Technology Stack

## 8.1. Backend

```text
Java
Spring Boot
Spring Security
JWT Authentication
Spring Data JPA
PostgreSQL
REST API
```

---

## 8.2. Frontend

```text
React
React Router
Axios
Context API or another state management method
CSS / Tailwind / Bootstrap depending on team decision
```

---

## 8.3. Database

```text
PostgreSQL
```

Main database file:

```text
database/schema.sql
```

---

## 8.4. Documentation Files

Important project files:

```text
docs/database-design.md
docs/api-design.md
docs/task-assignment.md
docs/team-working-guide.md
database/schema.sql
```

---

# 9. Database Notes

The database schema is already designed in:

```text
database/schema.sql
```

The schema includes all main tables, foreign keys, check constraints, indexes and updated_at triggers.

Important tables:

```text
users
roles
permissions
user_roles
role_permissions
patients
departments
doctors
staff
doctor_schedules
appointment_slots
doctor_leave_requests
appointments
appointment_status_histories
queue_tickets
consultation_sessions
medical_records
vital_signs
lab_tests
lab_requests
lab_request_items
lab_results
medical_services
medicines
prescriptions
prescription_items
drug_interaction_checks
suppliers
medicine_batches
stock_transactions
medicine_stock_alerts
invoices
invoice_items
payments
refunds
ai_chat_sessions
ai_chat_messages
ai_specialty_suggestions
ai_voice_transcriptions
notifications
reviews
articles
audit_logs
system_settings
```

Agents must follow `schema.sql` when creating Entity classes.

Do not invent new table names or column names unless the user explicitly asks.

---

# 10. API Design Notes

The API design is already defined in:

```text
docs/api-design.md
```

Agents must follow the API contract in this file.

Do not randomly rename endpoints.

Example:

```http
POST /api/appointments
```

Do not change it to:

```http
POST /api/appointments/create
```

unless the user explicitly requests a design change.

---

# 11. General API Response Format

All APIs should return this format:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

For error:

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

# 12. Authentication and Authorization

The project uses JWT authentication.

Request header:

```http
Authorization: Bearer <access_token>
```

Roles:

```text
PATIENT
DOCTOR
RECEPTIONIST
ADMIN
PHARMACIST
LAB_TECHNICIAN
```

Security rules:

```text
PATIENT can only access their own personal data.
DOCTOR can access patients related to their consultations.
RECEPTIONIST can manage appointment, check-in, queue, invoice and cash payment.
PHARMACIST can manage medicine, stock and prescription dispensing.
LAB_TECHNICIAN can manage lab requests and lab results.
ADMIN has full access.
```

---

# 13. Backend Package Structure

Recommended backend structure:

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
├── slot
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
├── audit
├── setting
├── report
├── file
├── common
├── config
└── security
```

Each module should normally include:

```text
Entity
Repository
Service
ServiceImpl
Controller
DTO request
DTO response
Mapper if needed
```

Example:

```text
patient/
├── Patient.java
├── PatientRepository.java
├── PatientService.java
├── PatientServiceImpl.java
├── PatientController.java
└── dto/
    ├── CreatePatientRequest.java
    ├── UpdatePatientRequest.java
    ├── PatientResponse.java
    └── PatientDetailResponse.java
```

---

# 14. Frontend Structure

Recommended frontend structure:

```text
src/
├── components/
├── context/
├── layouts/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── patient/
│   ├── doctor/
│   ├── department/
│   ├── appointment/
│   ├── queue/
│   ├── consultation/
│   ├── medicalRecord/
│   ├── lab/
│   ├── prescription/
│   ├── payment/
│   ├── inventory/
│   ├── ai/
│   ├── review/
│   ├── article/
│   └── report/
├── routes/
├── services/
└── utils/
```

Each module should have a service file.

Example:

```text
src/services/patientService.js
src/services/appointmentService.js
src/services/paymentService.js
```

Frontend should call backend through a shared axios client:

```text
src/services/axiosClient.js
```

---

# 15. Team Assignment

The team has 5 members.

## Person 1

Main responsibility:

```text
Leader
Auth
User
Role
Permission
Security
Core backend
Core frontend layout
```

Branch:

```text
feature/auth-user-security
```

---

## Person 2

Main responsibility:

```text
Patient
Doctor
Department
Staff
```

Branch:

```text
feature/patient-doctor-department
```

---

## Person 3

Main responsibility:

```text
Doctor Schedule
Appointment Slot
Appointment
Queue
Notification
```

Branch:

```text
feature/appointment-schedule-queue
```

---

## Person 4

Main responsibility:

```text
Consultation
Medical Record
Vital Signs
Lab
Prescription
```

Branch:

```text
feature/consultation-lab-prescription
```

---

## Person 5

Main responsibility:

```text
Medical Service
Medicine
Supplier
Inventory
Invoice
Payment
Refund
AI
Review
Article
Report
File Upload
```

Branch:

```text
feature/payment-inventory-ai
```

---

# 16. Git Workflow

Do not push directly to main.

Use feature branches.

Recommended branches:

```text
main
develop
feature/auth-user-security
feature/patient-doctor-department
feature/appointment-schedule-queue
feature/consultation-lab-prescription
feature/payment-inventory-ai
```

Common workflow:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/module-name
```

After coding:

```bash
git add .
git commit -m "Implement module name"
git push origin feature/module-name
```

Then create Pull Request into:

```text
develop
```

---

# 17. Development Priority

Recommended coding order:

```text
1. Backend core setup
2. PostgreSQL connection
3. Common response format
4. Global exception handler
5. Security and JWT basics
6. Frontend core layout
7. Auth API
8. User / Role API
9. Patient / Doctor / Department API
10. Schedule / Appointment API
11. Queue API
12. Consultation / Medical Record API
13. Lab API
14. Prescription API
15. Invoice / Payment API
16. Inventory API
17. AI API
18. Report API
```

---

# 18. What Person 1 Must Build First

Since Person 1 is the leader/core developer, Person 1 should build the foundation first.

## Backend core

```text
Spring Boot project structure
PostgreSQL connection
Common ApiResponse
GlobalExceptionHandler
CORS config
SecurityConfig
JWT service
JWT filter
AuthController
UserController
RoleController
```

## Frontend core

```text
React project structure
axiosClient
AuthContext
ProtectedRoute
DashboardLayout
Sidebar
Header
LoginPage
RegisterPage
```

After this, other team members can code their modules more easily.

---

# 19. Parallel Work Rule

The project can be developed in parallel.

Person 2, 3, 4 and 5 do not need to wait for Person 1 to finish everything.

They can start with:

```text
Entity
Repository
DTO
Service interface
Static frontend pages
Postman collection
```

They only need to wait for Person 1 for:

```text
JWT authentication
Common response
Protected frontend route
Axios config
Role-based authorization
```

---

# 20. Mockable Features

If there is not enough time, these features can be mocked:

```text
Google login
Online payment gateway
RxNorm / Drug Interaction API
AI chatbot real model
AI voice transcription
Email notification
Cloud file upload
```

Mocking suggestion:

```text
Payment gateway: use Confirm Payment button.
AI chatbot: return fixed response based on symptom keyword.
Drug interaction: return fake warning.
Voice transcription: allow doctor to type transcript manually.
File upload: use local file URL or manual URL input.
```

---

# 21. Final Demo Flow

The final project should be able to demo this flow:

```text
1. Admin logs in.
2. Admin creates department.
3. Admin creates doctor.
4. Admin creates doctor schedule.
5. System generates appointment slots.
6. Patient registers and logs in.
7. Patient views departments and doctors.
8. Patient selects available slot.
9. Patient books appointment.
10. Patient pays deposit or payment is mocked.
11. Receptionist checks in patient.
12. System creates queue ticket.
13. Doctor calls patient.
14. Doctor starts consultation.
15. Doctor enters medical record.
16. Doctor requests lab test if needed.
17. Lab technician enters lab result.
18. Doctor creates prescription.
19. Receptionist creates invoice.
20. Patient pays invoice.
21. Pharmacist dispenses medicine.
22. Admin views reports.
```

---

# 22. Important Rules for Agents

When helping this project, an AI agent should:

```text
Follow schema.sql for database and entity names.
Follow api-design.md for endpoint names.
Follow task-assignment.md for module ownership.
Use PostgreSQL, not MySQL.
Use DTOs, not direct Entity responses.
Keep AI as support only, not final diagnosis.
Do not invent new workflows unless asked.
Keep code consistent with Spring Boot and React.
Prefer simple, beginner-friendly implementation.
```

---

# 23. Current Project Status

Completed documentation:

```text
database-design.md
schema.sql
api-design.md
task-assignment.md
team-working-guide.md
```

Next development step:

```text
Person 1 sets up core backend and frontend foundation.
Other members start their modules based on docs.
```

---

# 24. Summary

This is a full-stack clinic management web application using:

```text
Spring Boot backend
PostgreSQL database
React frontend
JWT authentication
Role-based authorization
REST API
```

The project includes:

```text
Appointment booking
Reception check-in
Queue management
Doctor consultation
Electronic medical records
Lab requests and results
Prescription
Payment
Medicine inventory
AI support
Reports
Admin management
```

All development should follow the existing documentation and database schema.
