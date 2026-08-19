/** Shared booking lifecycle constants for all utility types (halls, rooms, vehicles, facilities). */

export const ACTIVE_BOOKING_STATUSES = [
    "pending",
    "coordinator_approved",
    "hod_approved",
    "registrar_approved",
    "director_approved",
    "confirmed"
];

export const TERMINAL_BOOKING_STATUSES = ["cancelled", "rejected", "completed"];

/** In approval chain — not yet confirmed; reject/approve allowed per role. */
export const IN_APPROVAL_PIPELINE_STATUSES = [
    "pending",
    "coordinator_approved",
    "hod_approved",
    "registrar_approved",
    "director_approved"
];

/** Confirmed bookings: no further approvals; cancel/modify rules differ from terminal. */
export const LOCKED_FOR_APPROVAL_STATUSES = ["confirmed"];

export const NON_ACTIONABLE_BOOKING_STATUSES = [
    ...TERMINAL_BOOKING_STATUSES,
    ...LOCKED_FOR_APPROVAL_STATUSES
];

export const ADMIN_ROLES = ["org_admin", "super_admin"];

/** Maps approver role to status after that step approves. */
export const APPROVED_STATUS_BY_ROLE = {
    coordinator: "coordinator_approved",
    hod: "hod_approved",
    registrar: "registrar_approved",
    director: "director_approved"
};

/** Default multi-step flow when category/utility has no configured steps. */
export const DEFAULT_APPROVAL_STEPS = [
    { id: "coordinator", order: 1, role: "coordinator", label: "Coordinator", isRequired: true },
    { id: "hod", order: 2, role: "hod", label: "Head of Department", isRequired: true },
    { id: "registrar", order: 3, role: "registrar", label: "Registrar", isRequired: true },
    { id: "director", order: 4, role: "director", label: "Director", isRequired: true }
];

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const HALL_TIME_SLOT_REGEX = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
