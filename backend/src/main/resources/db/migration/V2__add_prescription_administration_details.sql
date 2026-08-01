ALTER TABLE prescription_items
    ADD COLUMN IF NOT EXISTS administration_route VARCHAR(50);

ALTER TABLE prescription_items
    ADD COLUMN IF NOT EXISTS administration_timing VARCHAR(50);

ALTER TABLE prescription_items
    ADD COLUMN IF NOT EXISTS administration_site VARCHAR(255);

ALTER TABLE prescription_items
    ADD COLUMN IF NOT EXISTS package_info VARCHAR(255);

ALTER TABLE prescription_items
    ADD COLUMN IF NOT EXISTS as_needed BOOLEAN NOT NULL DEFAULT FALSE;
