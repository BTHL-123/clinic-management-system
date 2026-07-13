-- =========================================================
-- AI Clinic Management System
-- Full PostgreSQL Schema
-- =========================================================

BEGIN;

-- =========================================================
-- 0. Utility function for updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 1. Users / Roles / Permissions
-- =========================================================
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),

    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'
        CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    provider_id VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE CASCADE
);

CREATE TABLE email_otps (
    otp_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
        ON DELETE CASCADE
);

-- =========================================================
-- 2. Core Profiles
-- =========================================================
CREATE TABLE patients (
    patient_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,

    relationship_to_user VARCHAR(20) NOT NULL DEFAULT 'SELF'
        CHECK (relationship_to_user IN ('SELF', 'CHILD', 'PARENT', 'SPOUSE', 'OTHER')),

    patient_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,

    gender VARCHAR(20) NOT NULL DEFAULT 'OTHER'
        CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),

    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,

    identity_number VARCHAR(30),
    insurance_number VARCHAR(50),

    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),

    blood_type VARCHAR(10),
    allergies TEXT,
    medical_history TEXT,

    created_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patients_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_patients_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE departments (
    department_id BIGSERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    doctor_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    department_id BIGINT NOT NULL,

    doctor_code VARCHAR(30) NOT NULL UNIQUE,
    degree VARCHAR(100),
    specialization VARCHAR(150),
    years_of_experience INT NOT NULL DEFAULT 0 CHECK (years_of_experience >= 0),
    biography TEXT,
    consultation_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctors_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctors_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE RESTRICT
);

CREATE TABLE staff (
    staff_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,

    staff_code VARCHAR(30) NOT NULL UNIQUE,
    staff_type VARCHAR(30) NOT NULL
        CHECK (staff_type IN ('RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ADMIN')),

    position VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- =========================================================
-- 3. Doctor Scheduling
-- =========================================================
CREATE TABLE doctor_schedules (
    schedule_id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,

    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL DEFAULT 20 CHECK (max_patients > 0),

    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'FULL', 'CANCELLED', 'ON_LEAVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_schedules_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_doctor_schedule UNIQUE (doctor_id, work_date, start_time, end_time),
    CONSTRAINT chk_doctor_schedule_time CHECK (end_time > start_time)
);

CREATE TABLE appointment_slots (
    slot_id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED', 'CANCELLED')),

    locked_until TIMESTAMP,
    locked_by_patient_id BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_slots_schedule
        FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(schedule_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_appointment_slots_locked_by_patient
        FOREIGN KEY (locked_by_patient_id) REFERENCES patients(patient_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_appointment_slot UNIQUE (schedule_id, start_time, end_time),
    CONSTRAINT chk_appointment_slot_time CHECK (end_time > start_time)
);

CREATE TABLE doctor_leave_requests (
    leave_request_id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,

    request_type VARCHAR(30) NOT NULL
        CHECK (request_type IN ('LEAVE', 'CHANGE_SCHEDULE')),

    from_datetime TIMESTAMP NOT NULL,
    to_datetime TIMESTAMP NOT NULL,
    reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    approved_by BIGINT,
    approved_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_leave_requests_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctor_leave_requests_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_leave_request_time CHECK (to_datetime > from_datetime)
);

-- =========================================================
-- 4. Appointment / Queue
-- =========================================================
CREATE TABLE appointments (
    appointment_id BIGSERIAL PRIMARY KEY,
    appointment_code VARCHAR(30) NOT NULL UNIQUE,

    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    slot_id BIGINT,

    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    booking_type VARCHAR(20) NOT NULL
        CHECK (booking_type IN ('ONLINE', 'OFFLINE', 'WALK_IN')),

    reason_for_visit TEXT,
    initial_symptoms TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
        CHECK (status IN (
            'PENDING_PAYMENT',
            'CONFIRMED',
            'CHECKED_IN',
            'WAITING',
            'IN_PROGRESS',
            'PAYMENT_DUE',
            'COMPLETED',
            'CANCELLED',
            'NO_SHOW',
            'RESCHEDULED'
        )),

    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,

    deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),

    created_by BIGINT,
    cancelled_by BIGINT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,

    rescheduled_from_id BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointments_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointments_slot
        FOREIGN KEY (slot_id) REFERENCES appointment_slots(slot_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_appointments_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_appointments_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_appointments_rescheduled_from
        FOREIGN KEY (rescheduled_from_id) REFERENCES appointments(appointment_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_appointments_time CHECK (end_time > start_time)
);

CREATE TABLE appointment_status_histories (
    history_id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT,
    note TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_status_histories_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_appointment_status_histories_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE queue_tickets (
    queue_ticket_id BIGSERIAL PRIMARY KEY,

    appointment_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,

    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number INT NOT NULL CHECK (queue_number > 0),

    priority_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
        CHECK (priority_level IN ('NORMAL', 'PRIORITY', 'EMERGENCY')),

    status VARCHAR(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN (
            'WAITING',
            'CALLED',
            'IN_EXAMINATION',
            'WAITING_LAB',
            'DONE',
            'CANCELLED',
            'SKIPPED'
        )),

    estimated_wait_minutes INT CHECK (estimated_wait_minutes >= 0),

    checked_in_at TIMESTAMP,
    called_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_queue_tickets_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_queue_tickets_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_queue_tickets_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_queue_tickets_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_queue_ticket_doctor_number UNIQUE (doctor_id, queue_date, queue_number)
);

-- =========================================================
-- 5. Consultation / Medical Records
-- =========================================================
CREATE TABLE consultation_sessions (
    consultation_id BIGSERIAL PRIMARY KEY,

    appointment_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN (
            'WAITING',
            'IN_PROGRESS',
            'WAITING_LAB_RESULT',
            'PRESCRIBED',
            'COMPLETED'
        )),

    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consultation_sessions_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_consultation_sessions_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consultation_sessions_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
);

CREATE TABLE medical_records (
    medical_record_id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    symptoms TEXT,
    clinical_findings TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    doctor_note TEXT,

    follow_up_date DATE,
    follow_up_note TEXT,

    voice_input_transcript TEXT,
    ai_summary TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_medical_records_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultation_sessions(consultation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_records_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_medical_records_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
);

CREATE TABLE vital_signs (
    vital_sign_id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,

    height_cm NUMERIC(5,2) CHECK (height_cm > 0),
    weight_kg NUMERIC(5,2) CHECK (weight_kg > 0),
    temperature_c NUMERIC(4,1),
    blood_pressure_systolic INT CHECK (blood_pressure_systolic > 0),
    blood_pressure_diastolic INT CHECK (blood_pressure_diastolic > 0),
    heart_rate INT CHECK (heart_rate > 0),
    respiratory_rate INT CHECK (respiratory_rate > 0),
    spo2 INT CHECK (spo2 BETWEEN 0 AND 100),

    measured_by BIGINT,
    measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vital_signs_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultation_sessions(consultation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vital_signs_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_vital_signs_measured_by
        FOREIGN KEY (measured_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================================================
-- 6. Lab / Cận lâm sàng
-- =========================================================
CREATE TABLE lab_tests (
    lab_test_id BIGSERIAL PRIMARY KEY,
    test_code VARCHAR(30) NOT NULL UNIQUE,
    test_name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_requests (
    lab_request_id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    request_code VARCHAR(30) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    note TEXT,

    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_by BIGINT,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT fk_lab_requests_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultation_sessions(consultation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lab_requests_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lab_requests_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lab_requests_accepted_by
        FOREIGN KEY (accepted_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE lab_request_items (
    lab_request_item_id BIGSERIAL PRIMARY KEY,

    lab_request_id BIGINT NOT NULL,
    lab_test_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    CONSTRAINT fk_lab_request_items_request
        FOREIGN KEY (lab_request_id) REFERENCES lab_requests(lab_request_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lab_request_items_test
        FOREIGN KEY (lab_test_id) REFERENCES lab_tests(lab_test_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_lab_request_item UNIQUE (lab_request_id, lab_test_id)
);

CREATE TABLE lab_results (
    lab_result_id BIGSERIAL PRIMARY KEY,

    lab_request_item_id BIGINT NOT NULL UNIQUE,

    result_value TEXT,
    normal_range VARCHAR(100),
    result_unit VARCHAR(50),

    conclusion TEXT,
    result_file_url VARCHAR(500),

    entered_by BIGINT,
    entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lab_results_request_item
        FOREIGN KEY (lab_request_item_id) REFERENCES lab_request_items(lab_request_item_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lab_results_entered_by
        FOREIGN KEY (entered_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================================================
-- 7. Medical Services
-- =========================================================
CREATE TABLE medical_services (
    service_id BIGSERIAL PRIMARY KEY,

    service_code VARCHAR(30) NOT NULL UNIQUE,
    service_name VARCHAR(150) NOT NULL,

    service_type VARCHAR(20) NOT NULL DEFAULT 'OTHER'
        CHECK (service_type IN ('CONSULTATION', 'LAB_TEST', 'PACKAGE', 'OTHER')),

    price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 8. Prescription / Medicines
-- =========================================================
CREATE TABLE medicines (
    medicine_id BIGSERIAL PRIMARY KEY,

    medicine_code VARCHAR(30) NOT NULL UNIQUE,
    medicine_name VARCHAR(150) NOT NULL,

    active_ingredient VARCHAR(255),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    unit VARCHAR(50),

    rxnorm_code VARCHAR(100),
    description TEXT,
    usage_instructions VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    prescription_id BIGSERIAL PRIMARY KEY,

    prescription_code VARCHAR(30) NOT NULL UNIQUE,

    consultation_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'CREATED'
        CHECK (status IN ('CREATED', 'CHECKED', 'DISPENSED', 'CANCELLED')),

    drug_interaction_checked BOOLEAN NOT NULL DEFAULT FALSE,
    interaction_warning TEXT,
    doctor_note TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at TIMESTAMP,
    dispensed_at TIMESTAMP,

    CONSTRAINT fk_prescriptions_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultation_sessions(consultation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_prescriptions_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_prescriptions_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
);

CREATE TABLE prescription_items (
    prescription_item_id BIGSERIAL PRIMARY KEY,

    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,

    quantity INT NOT NULL CHECK (quantity > 0),

    dosage VARCHAR(255),
    frequency VARCHAR(255),
    duration VARCHAR(255),
    instructions TEXT,

    morning_dose VARCHAR(50),
    noon_dose VARCHAR(50),
    evening_dose VARCHAR(50),
    night_dose VARCHAR(50),

    CONSTRAINT fk_prescription_items_prescription
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_prescription_items_medicine
        FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
        ON DELETE RESTRICT
);

CREATE TABLE drug_interaction_checks (
    check_id BIGSERIAL PRIMARY KEY,

    prescription_id BIGINT NOT NULL,

    api_provider VARCHAR(30) NOT NULL DEFAULT 'RXNORM'
        CHECK (api_provider IN ('RXNORM', 'DRUG_INTERACTION_API', 'OTHER')),

    request_payload JSONB,
    response_payload JSONB,

    warning_level VARCHAR(20) NOT NULL DEFAULT 'NONE'
        CHECK (warning_level IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'SEVERE')),

    warning_message TEXT,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drug_interaction_checks_prescription
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
        ON DELETE CASCADE
);

-- =========================================================
-- 9. Inventory / Pharmacy
-- =========================================================
CREATE TABLE suppliers (
    supplier_id BIGSERIAL PRIMARY KEY,

    supplier_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicine_batches (
    batch_id BIGSERIAL PRIMARY KEY,

    medicine_id BIGINT NOT NULL,
    supplier_id BIGINT,

    batch_number VARCHAR(100) NOT NULL,

    manufacture_date DATE,
    expiry_date DATE NOT NULL,

    import_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (import_price >= 0),
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),

    initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
    current_quantity INT NOT NULL CHECK (current_quantity >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'LOW_STOCK', 'EXPIRED', 'OUT_OF_STOCK', 'CANCELLED')),

    imported_by BIGINT,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_medicine_batches_medicine
        FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_medicine_batches_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_medicine_batches_imported_by
        FOREIGN KEY (imported_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

CREATE TABLE stock_transactions (
    stock_transaction_id BIGSERIAL PRIMARY KEY,

    medicine_id BIGINT NOT NULL,
    batch_id BIGINT,

    transaction_type VARCHAR(30) NOT NULL
        CHECK (transaction_type IN ('IMPORT', 'EXPORT', 'ADJUSTMENT', 'RETURN', 'EXPIRED_REMOVAL')),

    quantity INT NOT NULL CHECK (quantity > 0),

    reference_type VARCHAR(30) NOT NULL DEFAULT 'OTHER'
        CHECK (reference_type IN ('PRESCRIPTION', 'MANUAL', 'SUPPLIER_IMPORT', 'INVOICE', 'OTHER')),

    reference_id BIGINT,
    note TEXT,

    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_transactions_medicine
        FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_stock_transactions_batch
        FOREIGN KEY (batch_id) REFERENCES medicine_batches(batch_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_stock_transactions_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE medicine_stock_alerts (
    alert_id BIGSERIAL PRIMARY KEY,

    medicine_id BIGINT NOT NULL,
    batch_id BIGINT,

    alert_type VARCHAR(20) NOT NULL
        CHECK (alert_type IN ('LOW_STOCK', 'EXPIRED', 'NEAR_EXPIRY')),

    message TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by BIGINT,
    resolved_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_medicine_stock_alerts_medicine
        FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_medicine_stock_alerts_batch
        FOREIGN KEY (batch_id) REFERENCES medicine_batches(batch_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_medicine_stock_alerts_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================================================
-- 10. Billing / Payment
-- =========================================================
CREATE TABLE invoices (
    invoice_id BIGSERIAL PRIMARY KEY,

    invoice_code VARCHAR(30) NOT NULL UNIQUE,

    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,

    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (final_amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
        CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),

    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,

    CONSTRAINT fk_invoices_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_invoices_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_invoices_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE invoice_items (
    invoice_item_id BIGSERIAL PRIMARY KEY,

    invoice_id BIGINT NOT NULL,

    item_type VARCHAR(20) NOT NULL
        CHECK (item_type IN ('CONSULTATION', 'LAB_TEST', 'MEDICINE', 'SERVICE', 'DEPOSIT')),

    reference_id BIGINT,
    item_name VARCHAR(255) NOT NULL,

    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),

    CONSTRAINT fk_invoice_items_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,

    invoice_id BIGINT,
    appointment_id BIGINT,

    payment_code VARCHAR(30) NOT NULL UNIQUE,

    payment_type VARCHAR(20) NOT NULL
        CHECK (payment_type IN ('DEPOSIT', 'FINAL_PAYMENT')),

    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('CASH', 'ONLINE', 'BANK_TRANSFER', 'CARD')),

    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),

    gateway_provider VARCHAR(100),
    gateway_transaction_id VARCHAR(255),

    paid_by BIGINT,
    confirmed_by BIGINT,

    paid_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_payments_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_payments_paid_by
        FOREIGN KEY (paid_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_payments_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE refunds (
    refund_id BIGSERIAL PRIMARY KEY,

    payment_id BIGINT NOT NULL,
    refund_code VARCHAR(30) NOT NULL UNIQUE,

    refund_amount NUMERIC(12,2) NOT NULL CHECK (refund_amount >= 0),
    reason TEXT,
    reject_reason TEXT,
    refund_method VARCHAR(30),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    account_holder_name VARCHAR(150),
    refund_transaction_ref VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED')),

    requested_by BIGINT,
    approved_by BIGINT,
    processed_by BIGINT,

    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    processed_at TIMESTAMP,

    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_refunds_requested_by
        FOREIGN KEY (requested_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_refunds_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_refunds_processed_by
        FOREIGN KEY (processed_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================================================
-- 11. AI Support
-- =========================================================
CREATE TABLE ai_chat_sessions (
    ai_chat_session_id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT,
    session_type VARCHAR(30) NOT NULL DEFAULT 'SYMPTOM_CHECK'
        CHECK (session_type IN ('SYMPTOM_CHECK', 'SPECIALTY_SUGGESTION', 'TRIAGE_SUPPORT')),

    summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_chat_sessions_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE SET NULL
);

CREATE TABLE ai_chat_messages (
    ai_chat_message_id BIGSERIAL PRIMARY KEY,

    ai_chat_session_id BIGINT NOT NULL,

    sender_type VARCHAR(20) NOT NULL
        CHECK (sender_type IN ('PATIENT', 'AI')),

    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_chat_messages_session
        FOREIGN KEY (ai_chat_session_id) REFERENCES ai_chat_sessions(ai_chat_session_id)
        ON DELETE CASCADE
);

CREATE TABLE ai_specialty_suggestions (
    suggestion_id BIGSERIAL PRIMARY KEY,

    ai_chat_session_id BIGINT NOT NULL,
    patient_id BIGINT,
    department_id BIGINT,

    symptoms_text TEXT,
    confidence_score NUMERIC(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
    explanation TEXT,

    accepted_by_patient BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_specialty_suggestions_session
        FOREIGN KEY (ai_chat_session_id) REFERENCES ai_chat_sessions(ai_chat_session_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_specialty_suggestions_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ai_specialty_suggestions_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL
);

CREATE TABLE ai_voice_transcriptions (
    transcription_id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    audio_file_url VARCHAR(500),
    transcript_text TEXT,
    ai_processed_text TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_voice_transcriptions_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultation_sessions(consultation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_voice_transcriptions_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
);

-- =========================================================
-- 12. Notifications / Reviews / Articles
-- =========================================================
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    notification_type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM'
        CHECK (notification_type IN (
            'APPOINTMENT_REMINDER',
            'PAYMENT',
            'LAB_RESULT',
            'PRESCRIPTION',
            'QUEUE_UPDATE',
            'SYSTEM',
            'FOLLOW_UP'
        )),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    related_type VARCHAR(100),
    related_id BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    appointment_id BIGINT,

    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE'
        CHECK (status IN ('VISIBLE', 'HIDDEN')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_reviews_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE SET NULL
);

CREATE TABLE articles (
    article_id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,

    content TEXT NOT NULL,
    thumbnail_url VARCHAR(500),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),

    created_by BIGINT,
    published_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_articles_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================================================
-- 13. Admin / Audit / Settings
-- =========================================================
CREATE TABLE audit_logs (
    audit_log_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,
    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100),
    record_id BIGINT,

    old_value JSONB,
    new_value JSONB,

    ip_address VARCHAR(100),
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE system_settings (
    setting_id BIGSERIAL PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,

    updated_by BIGINT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_settings_updated_by
);

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- =========================================================
-- 14. Indexes
-- =========================================================
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_email_otps_lookup ON email_otps(email, purpose, consumed, created_at DESC);

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_code ON patients(patient_code);

CREATE INDEX idx_doctors_department ON doctors(department_id);

CREATE INDEX idx_doctor_schedules_doctor_date
    ON doctor_schedules(doctor_id, work_date);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_queue_tickets_doctor_status
    ON queue_tickets(doctor_id, status);

CREATE INDEX idx_consultation_sessions_patient
    ON consultation_sessions(patient_id);

CREATE INDEX idx_medical_records_patient
    ON medical_records(patient_id);

CREATE INDEX idx_lab_requests_status
    ON lab_requests(status);

CREATE INDEX idx_lab_requests_consultation
    ON lab_requests(consultation_id);

CREATE INDEX idx_prescriptions_patient
    ON prescriptions(patient_id);

CREATE INDEX idx_medicines_name
    ON medicines(medicine_name);

CREATE INDEX idx_medicine_batches_expiry
    ON medicine_batches(expiry_date);

CREATE INDEX idx_stock_transactions_medicine
    ON stock_transactions(medicine_id);

CREATE INDEX idx_invoices_patient
    ON invoices(patient_id);

CREATE INDEX idx_payments_status
    ON payments(status);

CREATE INDEX idx_notifications_user_read
    ON notifications(user_id, is_read);

-- =========================================================
-- 15. updated_at triggers
-- =========================================================
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_consultation_sessions_updated_at
BEFORE UPDATE ON consultation_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_medical_records_updated_at
BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_medicines_updated_at
BEFORE UPDATE ON medicines
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 16. Seed data (optional but useful)
-- =========================================================
INSERT INTO roles (role_name, description) VALUES
('PATIENT', 'Patient role'),
('DOCTOR', 'Doctor role'),
('RECEPTIONIST', 'Receptionist role'),
('ADMIN', 'Administrator role'),
('PHARMACIST', 'Pharmacist role'),
('LAB_TECHNICIAN', 'Lab technician role')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permissions (permission_code, description) VALUES
('MANAGE_USERS', 'Manage user accounts'),
('MANAGE_DOCTORS', 'Manage doctor information'),
('MANAGE_STAFF', 'Manage staff information'),
('MANAGE_DEPARTMENTS', 'Manage departments'),
('VIEW_PATIENT_RECORD', 'View patient medical record'),
('CREATE_APPOINTMENT', 'Create appointment'),
('MANAGE_APPOINTMENT', 'Manage appointment'),
('CREATE_PRESCRIPTION', 'Create prescription'),
('MANAGE_MEDICINE_STOCK', 'Manage medicine stock'),
('VIEW_REPORT', 'View reports'),
('MANAGE_SETTINGS', 'Manage system settings')
ON CONFLICT (permission_code) DO NOTHING;

COMMIT;
