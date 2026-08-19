/** Maintenance ticket lifecycle — single source of truth for transitions. */

export const MAINTENANCE_STATUSES = [
    "PENDING_DEPT_HOD",
    "PENDING_WORKSHOP_HOD",
    "ASSIGNED_TO_WORKER",
    "PAUSED",
    "COMPLETED",
    "REJECTED"
];

export const TERMINAL_MAINTENANCE_STATUSES = ["COMPLETED", "REJECTED"];

/** Role may reject only while the ticket is in that role's approval stage. */
export const MAINTENANCE_REJECTABLE_BY_ROLE = {
    hod: ["PENDING_DEPT_HOD"],
    workshop_hod: ["PENDING_WORKSHOP_HOD"]
};

export const isTerminalMaintenanceStatus = (status) =>
    TERMINAL_MAINTENANCE_STATUSES.includes(status);

export const canRejectMaintenance = (role, status) => {
    const allowed = MAINTENANCE_REJECTABLE_BY_ROLE[role];
    return Array.isArray(allowed) && allowed.includes(status);
};

export const assertMaintenanceActionable = (status) => {
    if (isTerminalMaintenanceStatus(status)) {
        const error = new Error(`Cannot act on a ticket that is ${status}`);
        error.status = 409;
        throw error;
    }
};

export const assertWorkerCanUpdateProgress = (ticket, userId) => {
    if (ticket.status !== "ASSIGNED_TO_WORKER") {
        const error = new Error(`Cannot update progress when ticket is in ${ticket.status} status. It must be ASSIGNED_TO_WORKER.`);
        error.status = 409;
        throw error;
    }
    if (String(ticket.assignedWorkerId) !== String(userId)) {
        const error = new Error("Forbidden: You are not the assigned worker for this ticket.");
        error.status = 403;
        throw error;
    }
};
