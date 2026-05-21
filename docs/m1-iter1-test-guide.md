# M1 Iteration 1 Test Guide

This guide explains how to test M1 / Person 1 features after pulling the latest `dev` branch or the `feature/m1-iter1-completion` branch.

## 1. Prerequisites

Required tools:

```text
Java 21 or newer
Node.js 20 or newer
npm
PostgreSQL
```

## 2. Database Setup

Create the PostgreSQL database:

```bash
createdb clinic_management
```

Run the schema:

```bash
psql -d clinic_management -f database/schema.sql
```

Check backend DB config in:

```text
backend/src/main/resources/application.yml
```

Default values:

```yaml
DB_URL=jdbc:postgresql://localhost:5432/clinic_management
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

If your local PostgreSQL uses different username or password, update `application.yml` locally or export env variables before running backend.

## 3. Start Backend

Open Terminal 1:

```bash
cd backend
./mvnw spring-boot:run
```

Backend is running correctly when you see:

```text
Tomcat started on port 8080 (http) with context path '/api'
```

When backend starts, it seeds the default admin account if missing:

```text
email: admin@example.com
password: 123456
```

## 4. Start Frontend

Open Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## 5. Automated Build Checks

Backend test:

```bash
cd backend
./mvnw test
```

Expected result:

```text
BUILD SUCCESS
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Expected result:

```text
No ESLint errors
```

Frontend build:

```bash
cd frontend
npm run build
```

Expected result:

```text
built successfully
```

## 6. API Test With curl

Run these commands in Terminal 3 while backend is running.

### 6.1. Register Patient

Use a new email each time to avoid duplicate email errors.

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "email": "patient_test_001@example.com",
    "password": "123456",
    "phone": "0909000000",
    "gender": "MALE",
    "dateOfBirth": "2000-01-01",
    "address": "Da Nang"
  }'
```

Expected:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "userId": 1,
    "patientId": 1,
    "email": "patient_test_001@example.com",
    "role": "PATIENT"
  }
}
```

### 6.2. Login Patient

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient_test_001@example.com",
    "password": "123456"
  }'
```

Expected:

```text
success = true
data.accessToken exists
data.refreshToken exists
data.user.roles contains PATIENT
```

Copy the `accessToken`, then run:

```bash
TOKEN="paste_access_token_here"

curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

```text
success = true
data.email = patient_test_001@example.com
```

### 6.3. Test Unauthorized Request

```bash
curl -i http://localhost:8080/api/auth/me
```

Expected:

```text
HTTP/1.1 401
{"success":false,"message":"Unauthorized"}
```

### 6.4. Login Admin

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "123456"
  }'
```

Expected:

```text
success = true
data.user.roles contains ADMIN
```

Copy the admin access token:

```bash
ADMIN_TOKEN="paste_admin_access_token_here"
```

### 6.5. User Management API

```bash
curl "http://localhost:8080/api/users?page=0&size=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

```text
success = true
data.content is an array
data.page exists
data.totalElements exists
```

Create staff user:

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Tran Thi B",
    "email": "staff_test_001@example.com",
    "password": "123456",
    "phone": "0909111222",
    "roles": ["RECEPTIONIST"]
  }'
```

Expected:

```text
success = true
data.email = staff_test_001@example.com
data.roles contains RECEPTIONIST
```

### 6.6. Role and Permission API

Get roles:

```bash
curl http://localhost:8080/api/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

```text
success = true
data contains PATIENT, DOCTOR, RECEPTIONIST, ADMIN, PHARMACIST, LAB_TECHNICIAN
```

Get permissions:

```bash
curl http://localhost:8080/api/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

```text
success = true
data contains MANAGE_USERS and MANAGE_SETTINGS
```

## 7. Frontend UI Test

Open browser:

```text
http://localhost:5173
```

### 7.1. Register Page

Go to:

```text
http://localhost:5173/register
```

Test:

```text
Enter patient information
Submit form
Should redirect to login page
```

### 7.2. Login Page

Go to:

```text
http://localhost:5173/login
```

Test patient login:

```text
email: patient_test_001@example.com
password: 123456
```

Expected:

```text
Redirect to /dashboard
Dashboard displays current user name and role
```

### 7.3. Admin Dashboard

Logout, then login with:

```text
email: admin@example.com
password: 123456
```

Expected:

```text
Redirect to /dashboard
Sidebar shows Dashboard, Users, Security
```

### 7.4. Users Page

Go to:

```text
http://localhost:5173/dashboard/users
```

Test:

```text
User table loads
Search/filter controls render
Create user form works
Lock/unlock buttons work
Delete button calls API
Pagination buttons render
```

### 7.5. Security Page

Go to:

```text
http://localhost:5173/dashboard/security
```

Test:

```text
Role list loads
Permission list loads
Selecting a role fills the form
Creating a new role works
Assigning permissions works
Deleting a custom role works
```

## 8. Pass Criteria

M1 Iteration 1 passes when:

```text
Backend test passes
Frontend lint passes
Frontend build passes
Register works
Login works
Logout works
/auth/me works
Unauthorized request returns 401
Admin can view users
Admin can view roles
Admin can view permissions
Users page loads in frontend
Security page loads in frontend
```

## 9. Known Limitations

These are acceptable for Iteration 1:

```text
Logout does not revoke refresh tokens in DB yet.
Forgot password and reset password do not send real email yet.
Audit log auto-recording is not implemented yet.
Advanced permission-based authorization is not fully enforced yet.
Appointment pages are intentionally not included because they belong to M3.
```
