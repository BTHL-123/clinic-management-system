import assert from "node:assert/strict";
import test from "node:test";
import { canUserAccessPath } from "./roleAccess.js";

const userWithRole = (roleName) => ({ roles: [{ roleName }] });

test("a doctor cannot reopen the receptionist check-in page", () => {
  assert.equal(
    canUserAccessPath(userWithRole("DOCTOR"), "/dashboard/receptionist-appointments"),
    false,
  );
});

test("a receptionist can use the check-in page", () => {
  assert.equal(
    canUserAccessPath(userWithRole("RECEPTIONIST"), "/dashboard/receptionist-appointments"),
    true,
  );
});

test("a receptionist cannot reopen the patient booking page", () => {
  assert.equal(
    canUserAccessPath(userWithRole("RECEPTIONIST"), "/dashboard/available-slots"),
    false,
  );
});

test("a patient can use the booking page", () => {
  assert.equal(
    canUserAccessPath(userWithRole("PATIENT"), "/dashboard/available-slots"),
    true,
  );
});

test("shared dashboard pages remain available to every authenticated role", () => {
  assert.equal(canUserAccessPath(userWithRole("DOCTOR"), "/dashboard/profile"), true);
  assert.equal(canUserAccessPath(userWithRole("PATIENT"), "/dashboard"), true);
});

test("role names with the Spring Security prefix are normalized", () => {
  assert.equal(
    canUserAccessPath(userWithRole("ROLE_ADMIN"), "/dashboard/reports/revenue"),
    true,
  );
});
