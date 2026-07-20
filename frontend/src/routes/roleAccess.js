const ADMIN = "ADMIN";
const DOCTOR = "DOCTOR";
const PATIENT = "PATIENT";
const RECEPTIONIST = "RECEPTIONIST";
const PHARMACIST = "PHARMACIST";
const LAB_TECHNICIAN = "LAB_TECHNICIAN";

const ACCESS_RULES = [
  {
    pattern: /^\/dashboard\/(?:users|security|reports\/revenue|audit-logs|system-settings|admin\/doctor-leave-requests)(?:\/|$)/,
    roles: [ADMIN],
  },
  {
    pattern: /^\/dashboard\/(?:available-slots|ai-chat|my-appointments|my-medical-history|queue-status|our-doctors|service-prices|my-lab-results)(?:\/|$)/,
    roles: [PATIENT],
  },
  {
    pattern: /^\/dashboard\/payment\/callback(?:\/|$)/,
    roles: [PATIENT],
  },
  {
    pattern: /^\/dashboard\/(?:walk-in|receptionist-appointments|queue-management)(?:\/|$)/,
    roles: [ADMIN, RECEPTIONIST],
  },
  {
    pattern: /^\/dashboard\/(?:doctor-appointments|consultation|examination|doctor-leave-requests|doctor-schedule)(?:\/|$)/,
    roles: [DOCTOR],
  },
  {
    pattern: /^\/dashboard\/pharmacist\/prescriptions(?:\/|$)/,
    roles: [ADMIN, PHARMACIST],
  },
  {
    pattern: /^\/dashboard\/(?:suppliers|inventory\/batches|inventory\/transactions|inventory\/alerts)(?:\/|$)/,
    roles: [ADMIN, PHARMACIST],
  },
  {
    pattern: /^\/dashboard\/lab-requests(?:\/|$)/,
    roles: [ADMIN, DOCTOR, LAB_TECHNICIAN],
  },
  {
    pattern: /^\/dashboard\/lab-tests(?:\/|$)/,
    roles: [ADMIN, LAB_TECHNICIAN],
  },
  {
    pattern: /^\/dashboard\/(?:departments|medical-services|invoices|payments|refunds|doctors|reviews)(?:\/|$)/,
    roles: [ADMIN, RECEPTIONIST],
  },
  {
    pattern: /^\/dashboard\/patients(?:\/|$)/,
    roles: [ADMIN, RECEPTIONIST, DOCTOR],
  },
  {
    pattern: /^\/dashboard\/appointments$/,
    roles: [ADMIN, RECEPTIONIST, DOCTOR],
  },
  {
    pattern: /^\/dashboard\/appointments\/[^/]+(?:\/|$)/,
    roles: [ADMIN, RECEPTIONIST, DOCTOR, PATIENT],
  },
  {
    pattern: /^\/dashboard\/medicines(?:\/|$)/,
    roles: [ADMIN, DOCTOR, PHARMACIST],
  },
  {
    pattern: /^\/dashboard\/prescriptions\/[^/]+(?:\/|$)/,
    roles: [DOCTOR, PATIENT, PHARMACIST],
  },
  {
    pattern: /^\/dashboard\/articles(?:\/|$)/,
    roles: [ADMIN, DOCTOR],
  },
];

export const getUserRoles = (user) =>
  (user?.roles || [])
    .map((role) => (typeof role === "string" ? role : role?.roleName))
    .filter(Boolean)
    .map((role) => role.replace(/^ROLE_/, "").toUpperCase());

export const canUserAccessPath = (user, pathname) => {
  const normalizedPath = String(pathname || "/").split(/[?#]/, 1)[0];
  const rule = ACCESS_RULES.find(({ pattern }) => pattern.test(normalizedPath));

  if (!rule) {
    return true;
  }

  const roles = getUserRoles(user);
  return rule.roles.some((role) => roles.includes(role));
};
