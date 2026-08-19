import {
    APPROVED_STATUS_BY_ROLE,
    ADMIN_ROLES,
    DEFAULT_APPROVAL_STEPS,
    IN_APPROVAL_PIPELINE_STATUSES,
    LOCKED_FOR_APPROVAL_STATUSES
} from "./bookingConstants.js";

const sortSteps = (steps) =>
    [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const normalizeRole = (role) => (role && role.endsWith("_hod") ? "hod" : role);

/**
 * Resolve approval chain: utility override → category steps → system default.
 */
export const resolveApprovalFlow = (utility, category) => {
    const utilitySteps = utility?.approvalFlow;
    if (Array.isArray(utilitySteps) && utilitySteps.length > 0) {
        const categorySteps = category?.approvalFlow?.steps || [];
        const mergedSteps = utilitySteps.map((uStep) => {
            const cStep = categorySteps.find((cs) => cs.role === uStep.role);
            return {
                id: uStep.id || cStep?.id,
                order: uStep.order ?? cStep?.order,
                role: uStep.role,
                label: uStep.label || cStep?.label,
                isRequired: uStep.isRequired ?? cStep?.isRequired,
                approverId: uStep.approverId || cStep?.approverId,
                approverName: uStep.approverName || cStep?.approverName
            };
        });
        return {
            steps: sortSteps(mergedSteps),
            allowSkipOnAdminApproval:
                category?.approvalFlow?.allowSkipOnAdminApproval !== false,
            autoConfirmAfterLastStep:
                category?.approvalFlow?.autoConfirmAfterLastStep === true
        };
    }

    const categorySteps = category?.approvalFlow?.steps;
    if (Array.isArray(categorySteps) && categorySteps.length > 0) {
        return {
            steps: sortSteps(categorySteps),
            allowSkipOnAdminApproval:
                category?.approvalFlow?.allowSkipOnAdminApproval !== false,
            autoConfirmAfterLastStep:
                category?.approvalFlow?.autoConfirmAfterLastStep === true
        };
    }

    return {
        steps: DEFAULT_APPROVAL_STEPS,
        allowSkipOnAdminApproval: true,
        autoConfirmAfterLastStep: false
    };
};

/** No approval steps → booking is confirmed immediately on create. */
export const getInitialBookingStatus = (flow) => {
    const requiredSteps = flow.steps.filter((s) => s.isRequired !== false);
    if (requiredSteps.length === 0) return "confirmed";
    return "pending";
};

export const roleToApprovedStatus = (role) => APPROVED_STATUS_BY_ROLE[normalizeRole(role)] || null;

export const getRequiredSteps = (flow) => flow.steps.filter((s) => s.isRequired !== false);

/**
 * Status the booking must be in before the given role can approve.
 */
export const getExpectedStatusForApprover = (flow, approverRole) => {
    const role = normalizeRole(approverRole);
    const steps = getRequiredSteps(flow);
    const stepIndex = steps.findIndex((s) => normalizeRole(s.role) === role);
    if (stepIndex < 0) return null;
    if (stepIndex === 0) return "pending";
    const priorRole = steps[stepIndex - 1].role;
    return roleToApprovedStatus(priorRole);
};

/**
 * Allowed prior statuses when optional steps are skipped (registrar may follow coordinator).
 */
export const getAllowedStatusesForApprover = (flow, approverRole) => {
    const role = normalizeRole(approverRole);
    const steps = getRequiredSteps(flow);
    const stepIndex = steps.findIndex((s) => normalizeRole(s.role) === role);
    if (stepIndex < 0) return [];

    const allowed = [];
    for (let i = 0; i < stepIndex; i++) {
        const status = roleToApprovedStatus(steps[i].role);
        if (status) allowed.push(status);
    }
    if (stepIndex === 0) allowed.push("pending");
    return [...new Set(allowed)];
};

export const isLastApprovalStep = (flow, approverRole) => {
    const role = normalizeRole(approverRole);
    const steps = getRequiredSteps(flow);
    const stepIndex = steps.findIndex((s) => normalizeRole(s.role) === role);
    if (stepIndex < 0) return false;
    return stepIndex === steps.length - 1;
};

/**
 * Compute next status after an approve action.
 */
export const getNextStatusOnApprove = ({
    flow,
    currentStatus,
    approverRole,
    isAdmin,
    userId
}) => {
    if (LOCKED_FOR_APPROVAL_STATUSES.includes(currentStatus)) {
        return null;
    }

    const steps = getRequiredSteps(flow);

    if (steps.length === 0) {
        return currentStatus === "pending" ? "confirmed" : null;
    }

    if (isAdmin && flow.allowSkipOnAdminApproval) {
        if (!IN_APPROVAL_PIPELINE_STATUSES.includes(currentStatus)) {
            return null;
        }
        return "confirmed";
    }

    const role = normalizeRole(approverRole);
    const step = steps.find((s) => normalizeRole(s.role) === role);
    if (!step) {
        return null;
    }

    // If a specific approverId is set on the step, only that user can approve
    if (step.approverId && userId && step.approverId !== userId) {
        return null;
    }

    const expected = getExpectedStatusForApprover(flow, role);
    if (currentStatus !== expected) {
        return null;
    }

    const lastStep = isLastApprovalStep(flow, role);
    if (lastStep) {
        return "confirmed";
    }

    return roleToApprovedStatus(role);
};

/** Statuses an admin confirm action may transition from. */
export const getConfirmableStatuses = (flow) => {
    const steps = getRequiredSteps(flow);
    if (steps.length === 0) return [];
    return steps
        .map((s) => roleToApprovedStatus(s.role))
        .filter(Boolean);
};

export const canUserReject = (userRole) => {
    const approverRoles = [
        "coordinator",
        "hod",
        "registrar",
        "director",
        ...ADMIN_ROLES
    ];
    return approverRoles.includes(normalizeRole(userRole));
};

export const getIntermediateStatuses = (flow) => {
    return getRequiredSteps(flow)
        .map((s) => roleToApprovedStatus(s.role))
        .filter(Boolean);
};

export const isApproverRole = (role, flow) =>
    getRequiredSteps(flow).some((s) => normalizeRole(s.role) === normalizeRole(role)) || ADMIN_ROLES.includes(normalizeRole(role));

/** Whether a role may approve/reject at the current booking status (mirrors getNextStatusOnApprove). */
export const canApproveBookingAtStatus = ({
    flow,
    currentStatus,
    approverRole,
    isAdmin,
    userId
}) => getNextStatusOnApprove({ flow, currentStatus, approverRole, isAdmin, userId }) !== null;

/** Whether reject is valid at current status. */
export const canRejectBookingAtStatus = (flow, currentStatus, userRole) => {
    if (!canUserReject(userRole)) return false;
    if (LOCKED_FOR_APPROVAL_STATUSES.includes(currentStatus)) return false;
    const intermediate = getIntermediateStatuses(flow);
    return currentStatus === "pending" || intermediate.includes(currentStatus);
};
