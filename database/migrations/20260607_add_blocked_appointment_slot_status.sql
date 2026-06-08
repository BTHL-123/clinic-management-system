ALTER TABLE appointment_slots
    DROP CONSTRAINT IF EXISTS appointment_slots_status_check;

ALTER TABLE appointment_slots
    ADD CONSTRAINT appointment_slots_status_check
    CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED', 'CANCELLED'));
