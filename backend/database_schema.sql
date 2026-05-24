-- Script tạo bảng cho Medical Services
CREATE TABLE IF NOT EXISTS medical_services (
    service_id BIGSERIAL PRIMARY KEY,
    service_code VARCHAR(30) NOT NULL UNIQUE,
    service_name VARCHAR(150) NOT NULL,
    service_type VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Script tạo bảng cho Invoices
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id BIGSERIAL PRIMARY KEY,
    invoice_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    created_by BIGINT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    item_id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(invoice_id),
    item_type VARCHAR(50) NOT NULL,
    reference_id BIGINT,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- Script tạo bảng cho Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(invoice_id),
    appointment_id BIGINT,
    payment_code VARCHAR(30) NOT NULL UNIQUE,
    payment_type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    gateway_provider VARCHAR(100),
    gateway_transaction_id VARCHAR(255),
    paid_by BIGINT,
    confirmed_by BIGINT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
