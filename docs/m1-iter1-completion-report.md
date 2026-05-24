# M1 Iteration 1 Completion Report

Updated at: 2026-05-19 18:11 +07

## Scope

This report summarizes the work completed for M1 / Person 1 in Iteration 1.

Reference task range from the tracking sheet:

```text
1. Project setup
2. PostgreSQL connection
3. Security config
4. Register
5. Login
6. Logout
7. Current user profile
8. User management
9. Role management
10. Dashboard layout
```

## Completed Items

### 1. Project setup

Implemented:

- Spring Boot backend project under `backend/`.
- React Vite frontend project under `frontend/`.
- Maven wrapper for backend execution without global Maven.
- Common backend package structure for auth, user, role, permission, security, common, config, audit log and system setting modules.
- Frontend structure for layouts, routes, context, services, components and pages.

### 2. PostgreSQL connection

Implemented:

- PostgreSQL datasource configuration in `backend/src/main/resources/application.yml`.
- Environment variable support for DB URL, DB username and DB password.
- H2 test profile for backend context tests.
- Verified runtime connection with local PostgreSQL after running `database/schema.sql`.

### 3. Security config

Implemented:

- Spring Security stateless configuration.
- JWT service and JWT authentication filter.
- BCrypt password encoder.
- CORS configuration for frontend origins.
- JSON responses for unauthorized and access denied requests.
- Role-based protection for admin APIs.

### 4. Register

Implemented:

- Backend endpoint: `POST /api/auth/register`.
- Patient account creation.
- Linked patient profile creation.
- Frontend register page at `/register`.

### 5. Login

Implemented:

- Backend endpoint: `POST /api/auth/login`.
- JWT access token and refresh token response.
- Frontend login page at `/login`.
- Token storage through `AuthContext`.

### 6. Logout

Implemented:

- Backend endpoint: `POST /api/auth/logout`.
- Frontend logout button in dashboard header.
- Local token cleanup after logout.

Note:

- Refresh token persistence/revocation table is not implemented because the current schema does not include a refresh token table.

### 7. Current user profile

Implemented:

- Backend endpoint: `GET /api/auth/me`.
- Frontend session restore through `AuthContext`.
- Dashboard header displays current user name and roles.

### 8. User management

Implemented:

- Backend APIs for user list, detail, create, update, lock, unlock and delete.
- Frontend user management page at `/dashboard/users`.
- User filtering by keyword, status and role.
- Paginated user table.
- Create user form.
- Edit user form.
- Lock, unlock and delete actions.

### 9. Role management

Implemented:

- Backend APIs for roles and permissions.
- Backend API for assigning permissions to a role.
- Frontend security page at `/dashboard/security`.
- Role list.
- Create/update role form.
- Permission checkbox assignment UI.
- Delete role action.

### 10. Dashboard layout

Implemented:

- Protected dashboard route at `/dashboard`.
- Dashboard layout with sidebar and header.
- Sidebar routes:
  - `/dashboard`
  - `/dashboard/users`
  - `/dashboard/security`
- Appointment navigation is intentionally left for M3 to avoid module overlap.

## Seed Data

The backend seeds the following data on startup if missing:

- Roles:
  - `PATIENT`
  - `DOCTOR`
  - `RECEPTIONIST`
  - `ADMIN`
  - `PHARMACIST`
  - `LAB_TECHNICIAN`
- Permissions:
  - `MANAGE_USERS`
  - `MANAGE_DOCTORS`
  - `MANAGE_STAFF`
  - `MANAGE_DEPARTMENTS`
  - `VIEW_PATIENT_RECORD`
  - `CREATE_APPOINTMENT`
  - `MANAGE_APPOINTMENT`
  - `CREATE_PRESCRIPTION`
  - `MANAGE_MEDICINE_STOCK`
  - `VIEW_REPORT`
  - `MANAGE_SETTINGS`
- Default admin account:
  - Email: `admin@example.com`
  - Password: `123456`

## Verification

Commands executed successfully:

```bash
cd backend
./mvnw test
```

```bash
cd frontend
npm run lint
npm run build
```

Runtime API checks completed successfully with PostgreSQL:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/roles`
- `GET /api/permissions`

Frontend routes checked:

- `/login`
- `/register`
- `/dashboard`
- `/dashboard/users`
- `/dashboard/security`

## Remaining Notes

- Logout currently clears client tokens and returns success from backend. Full refresh token revocation requires adding refresh token persistence to the database design.
- Forgot password and reset password endpoints are placeholders and do not send real email yet.
- Appointment navigation and pages are intentionally left out because appointment work belongs to M3.
