import { Requisition } from "../models/Requisition.js";
import { User } from "../models/User.js";
import { CanteenMenu } from "../models/CanteenMenu.js";
import { Organization } from "../models/Organization.js";
import { sendEmail } from "../utils/emailService.js";
import {
  canteenRequisitionCreatedTemplate,
  canteenRequisitionStatusTemplate,
  canteenRequisitionFulfilmentTemplate,
  canteenOwnerOrderTemplate
} from "../utils/emailTemplates.js";
import {
  STATUS_BY_APPROVER_ROLE,
  NEXT_STATUS_BY_APPROVER_ROLE,
  assertRequisitionApprovalActionable,
  advanceRequisitionStatus,
  isTerminalRequisitionStatus
} from "../workflows/requisitionWorkflow.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { resolveActorProfile } from "../utils/authorization.js";

const DEFAULT_DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics",
  "Information Technology",
  "Administration",
  "Other"
];

export const listDepartments = async ({ orgId }) => {
  const departments = await User.distinct("department", {
    organizationId: orgId,
    department: { $exists: true, $ne: null, $ne: "" }
  });
  const unique = [...new Set([...DEFAULT_DEPARTMENTS, ...departments.filter(Boolean)])];
  return unique.sort();
};

const STATUS_BY_ROLE = STATUS_BY_APPROVER_ROLE;
const NEXT_STATUS_MAP = NEXT_STATUS_BY_APPROVER_ROLE;

const departmentMatches = (a, b) => {
  const x = String(a || "").trim().toLowerCase();
  const y = String(b || "").trim().toLowerCase();
  if (!x || !y) return false;
  return x === y;
};

const buildListQuery = (orgId, user) => {
  const base = { organizationId: orgId };
  const role = user.role;

  if (role === "super_admin" || role === "org_admin") return base;
  if (role === "assistant") return { ...base, requesterId: user.sub };
  if (role === "hod") {
    // HOD sees requisitions for their department (all statuses) to track and also to create orders.
    const dept = user.department;
    if (dept) return { ...base, department: dept };
    return base;
  }
  // Registrar and Director see all requisitions (for oversight); approve/reject only when req is in their queue
  if (role === "registrar" || role === "director") return base;
  if (role === "canteen_owner") {
    return { ...base, status: { $in: ["APPROVED_DIRECTOR", "PREPARED", "HANDED_OVER"] } };
  }
  return { ...base, requesterId: user.sub };
};

export const listRequisitions = async ({ orgId, status, user }) => {
  const query = buildListQuery(orgId, user);
  if (status) query.status = status;
  return Requisition.find(query).sort({ createdAt: -1 }).lean();
};

export const getRequisition = async ({ orgId, reqId, user }) => {
  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  }).lean();

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  const role = user.role;
  if (role === "super_admin" || role === "org_admin") return req;
  if (role === "assistant" && req.requesterId !== user.sub) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
  if (role === "hod") {
    if (user.department && req.department && !departmentMatches(user.department, req.department)) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
    return req;
  }
  // Registrar and Director can view all requisitions (for oversight); approve/reject enforced in updateStatus
  if (role === "registrar" || role === "director") return req;
  if (role === "canteen_owner" && !["APPROVED_DIRECTOR", "PREPARED", "HANDED_OVER"].includes(req.status)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
  return req;
};

export const createRequisition = async ({ orgId, payload, user }) => {
  const CREATOR_ROLES = ["assistant", "hod", "org_admin", "super_admin"];
  if (!CREATOR_ROLES.includes(user.role)) {
    const error = new Error("Only assistants, HODs, and org admins can create requisitions");
    error.status = 403;
    throw error;
  }

  const { items, department, comment, reasoning } = payload;
  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error("At least one item is required");
    error.status = 400;
    throw error;
  }

  if (user.role !== "assistant" && (!department || !department.trim())) {
    const error = new Error("Department is required");
    error.status = 400;
    throw error;
  }

  if (!reasoning || !reasoning.trim()) {
    const error = new Error("Reasoning is required");
    error.status = 400;
    throw error;
  }

  const resolvedItems = [];
  const billingItems = [];
  let totalAmount = 0;

  for (const item of items) {
    if (!item.menuItemId || item.quantity == null || item.quantity < 1) {
      const error = new Error("Each item must have a menu item and quantity");
      error.status = 400;
      throw error;
    }
    const menuItem = await CanteenMenu.findOne({
      _id: item.menuItemId,
      organizationId: orgId,
      isActive: true
    }).lean();
    if (!menuItem) {
      const error = new Error(`Menu item not found: ${item.menuItemId}`);
      error.status = 400;
      throw error;
    }
    const quantity = Number(item.quantity);
    const unitPrice = menuItem.price != null ? Number(menuItem.price) : 0;
    const amount = unitPrice * quantity;
    totalAmount += amount;

    resolvedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      type: menuItem.type,
      unit: menuItem.unit,
      quantity,
      reasoning: reasoning.trim()
    });
    billingItems.push({
      name: menuItem.name,
      quantity,
      unitPrice,
      amount
    });
  }

  const requester = await resolveActorProfile(user, orgId);
  if (!requester) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const resolvedDept = user.role === "assistant" ? (requester.department || department) : department;
  if (!resolvedDept || !resolvedDept.trim()) {
    const error = new Error("Department is required");
    error.status = 400;
    throw error;
  }

  const createdByHod = user.role === "hod";
  const requisition = await Requisition.create({
    organizationId: orgId,
    requesterId: String(requester._id || user.sub),
    requesterName: requester.name || user.email,
    requesterEmail: user.email || requester.email,
    requesterDepartment: requester.department || "",
    department: resolvedDept.trim(),
    comment: comment ? comment.trim() : undefined,
    items: resolvedItems,
    billing: {
      totalAmount,
      currency: "INR",
      items: billingItems,
      generatedAt: new Date()
    },
    status: createdByHod ? "APPROVED_HOD" : "PENDING_HOD",
    approvals: createdByHod
      ? [
          {
            stepOrder: 1,
            role: "hod",
            label: "hod decision",
            approverId: user.sub,
            approverName: requester.name || user.email,
            status: "approved",
            remarks: "Auto-approved (created by HOD)",
            timestamp: new Date()
          }
        ]
      : [],
    comments: [],
    submittedAt: new Date()
  });

  // Send notification emails (requester + HOD) asynchronously in background
  (async () => {
    try {
      const organization = await Organization.findById(orgId).lean();
      const reqObj = requisition.toObject ? requisition.toObject() : requisition;

      if (requester && requisition.requesterEmail) {
        const html = canteenRequisitionCreatedTemplate(reqObj, requester, organization);
        await sendEmail({
          to: requisition.requesterEmail,
          subject: "MITAOE Canteen Requisition Submitted",
          html
        });
      }

      if (!createdByHod) {
        // Notify HOD of this department, if available
        const dept = requisition.department || "";
        const hod = await User.findOne({
          organizationId: orgId,
          role: "hod",
          // Match department case-insensitively to avoid missing emails
          department: { $regex: `^${escapeRegex(dept)}$`, $options: "i" }
        }).lean();

        if (hod && hod.email) {
          const htmlHod = canteenRequisitionStatusTemplate(
            reqObj,
            hod,
            requester || { name: user.email, email: user.email },
            {
              heading: "New Canteen Requisition Pending Your Approval",
              introLine:
                "A new canteen requisition has been submitted by your department and is awaiting your review.",
              highlightLine:
                "Please log in to MITAOE Unified ERP to approve or reject this requisition."
            },
            organization
          );

          await sendEmail({
            to: hod.email,
            subject: "MITAOE | New Canteen Requisition Pending Approval",
            html: htmlHod
          });
        }
      } else {
        // Created by HOD => notify Registrar (next approver)
        const registrar = await User.findOne({ organizationId: orgId, role: "registrar" }).lean();
        if (registrar && registrar.email) {
          const htmlReg = canteenRequisitionStatusTemplate(
            reqObj,
            registrar,
            requester || { name: user.email, email: user.email },
            {
              heading: "MITAOE Canteen Requisition Awaiting Your Approval",
              introLine:
                "A canteen requisition has been submitted by a Head of Department and is awaiting your approval.",
              highlightLine:
                "Please log in to MITAOE Unified ERP to review and take action on this requisition."
            },
            organization
          );
          await sendEmail({
            to: registrar.email,
            subject: "MITAOE | Canteen Requisition Pending Approval",
            html: htmlReg
          });
        }
      }
    } catch (emailError) {
      console.error("[Requisition Service] Error sending creation emails in background:", emailError);
    }
  })();

  return requisition;
};

const canEdit = (req, user) => {
  const role = user.role;
  if (role === "super_admin" || role === "org_admin") return true;

  if (role === "hod" && req.status === "PENDING_HOD") {
    if (user.department && req.department && !departmentMatches(user.department, req.department)) {
      return false;
    }
    return true;
  }
  if (role === "registrar" && req.status === "APPROVED_HOD") {
    return true;
  }
  if (role === "director" && req.status === "APPROVED_REGISTRAR") {
    return true;
  }

  return false;
};

export const updateRequisition = async ({ orgId, reqId, payload, user }) => {
  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  });

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  if (!canEdit(req, user)) {
    const error = new Error("You cannot edit this requisition at this stage");
    error.status = 403;
    throw error;
  }

  const { items, department, comment, reasoning, remarks } = payload;

  if (!remarks || !remarks.trim()) {
    const error = new Error("Remarks are required to update/modify the canteen order");
    error.status = 400;
    throw error;
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error("At least one item is required");
      error.status = 400;
      throw error;
    }

    const resolvedItems = [];
    const billingItems = [];
    let totalAmount = 0;
    const activeReasoning = (reasoning && reasoning.trim()) || req.items[0]?.reasoning || "Modified order";

    for (const item of items) {
      if (!item.menuItemId || item.quantity == null || item.quantity < 1) {
        const error = new Error("Each item must have a menu item and quantity");
        error.status = 400;
        throw error;
      }
      const menuItem = await CanteenMenu.findOne({
        _id: item.menuItemId,
        organizationId: orgId,
        isActive: true
      }).lean();
      if (!menuItem) {
        const error = new Error(`Menu item not found: ${item.menuItemId}`);
        error.status = 400;
        throw error;
      }
      const quantity = Number(item.quantity);
      const unitPrice = menuItem.price != null ? Number(menuItem.price) : 0;
      const amount = unitPrice * quantity;
      totalAmount += amount;

      resolvedItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        type: menuItem.type,
        unit: menuItem.unit,
        quantity,
        reasoning: activeReasoning
      });
      billingItems.push({
        name: menuItem.name,
        quantity,
        unitPrice,
        amount
      });
    }
    req.items = resolvedItems;
    req.billing = {
      totalAmount,
      currency: req.billing?.currency || "INR",
      items: billingItems,
      generatedAt: new Date()
    };
  }

  if (department !== undefined) req.department = department;
  if (comment !== undefined) req.comment = comment ? comment.trim() : undefined;

  if (remarks && remarks.trim()) {
    req.comments = req.comments || [];
    req.comments.push({
      authorId: user.sub,
      authorName: user.email,
      authorRole: user.role,
      content: `Order modified. Remarks: ${remarks.trim()}`,
      createdAt: new Date()
    });
  }

  await req.save();
  return req;
};

export const updateRequisitionStatus = async ({ orgId, reqId, action, remarks, user }) => {
  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  });

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  assertRequisitionApprovalActionable(req.status);

  const role = user.role;
  const expectedStatus = STATUS_BY_ROLE[role];
  const nextStatus = NEXT_STATUS_MAP[role];

  // Strict stage enforcement (prevents skipping approval levels).
  // If UI is stale and the request already moved forward, return a clear error.
  if (role !== "super_admin" && role !== "org_admin") {
    if (!expectedStatus || !nextStatus) {
      const error = new Error("You cannot approve or reject requisitions");
      error.status = 403;
      throw error;
    }
    if (req.status !== expectedStatus) {
      const error = new Error(
        `This requisition is no longer in your approval queue (current status: ${req.status}). Please refresh.`
      );
      error.status = 409;
      throw error;
    }
  }

  const previousStatus = req.status;
  let nextReqStatus = previousStatus;

  if (action === "approve") {
    if (role === "super_admin" || role === "org_admin") {
      nextReqStatus = advanceRequisitionStatus(req.status);
      req.status = nextReqStatus;
    } else {
      req.status = nextStatus;
    }
  } else if (action === "cancel") {
    req.status = "CANCELLED";
  } else {
    const error = new Error("Invalid action. Use approve or cancel");
    error.status = 400;
    throw error;
  }

  req.approvals = req.approvals || [];
  req.approvals.push({
    stepOrder: req.approvals.length + 1,
    role: user.role,
    label: `${user.role} ${action}`,
    approverId: user.sub,
    approverName: user.email,
    status: action === "cancel" ? "rejected" : "approved",
    action,
    fromStatus: previousStatus,
    toStatus: req.status,
    remarks,
    timestamp: new Date()
  });
  await req.save();

  const reqObj = req.toObject ? req.toObject() : req;

  // Email notifications on status change (asynchronous in background)
  (async () => {
    try {
      const [requesterUser, organization, hodUser, registrarUser, directorUser, actorUser] =
        await Promise.all([
          User.findOne({ _id: req.requesterId }).lean(),
          Organization.findById(orgId).lean(),
          User.findOne({ organizationId: orgId, role: "hod", department: req.department }).lean(),
          User.findOne({ organizationId: orgId, role: "registrar" }).lean(),
          User.findOne({ organizationId: orgId, role: "director" }).lean(),
          resolveActorProfile(user, orgId)
        ]);

      const actor = actorUser || { name: user.email, email: user.email };

      // Always notify requester about status change
      if (requesterUser && req.requesterEmail) {
        const heading =
          req.status === "CANCELLED"
            ? "MITAOE Canteen Requisition Cancelled"
            : "MITAOE Canteen Requisition Status Updated";
        const introLine =
          req.status === "CANCELLED"
            ? "Your canteen requisition has been cancelled."
            : "The status of your canteen requisition has been updated.";
        const highlightLine = `Status changed from ${previousStatus} to ${req.status}.`;

        const html = canteenRequisitionStatusTemplate(
          reqObj,
          requesterUser,
          actor,
          { heading, introLine, highlightLine },
          organization
        );

        await sendEmail({
          to: req.requesterEmail,
          subject: heading,
          html
        });
      }

      // Notify next approver when approved
      if (action === "approve" && role !== "super_admin" && role !== "org_admin") {
        const nextRoleMap = { hod: "registrar", registrar: "director" };
        const nextRole = nextRoleMap[role];
        let nextUser = null;

        if (nextRole === "registrar") nextUser = registrarUser;
        if (nextRole === "director") nextUser = directorUser;

        if (nextUser && nextUser.email) {
          const htmlNext = canteenRequisitionStatusTemplate(
            reqObj,
            nextUser,
            actor,
            {
              heading: "MITAOE Canteen Requisition Awaiting Your Approval",
              introLine:
                "A canteen requisition has advanced in the workflow and is now awaiting your approval.",
              highlightLine:
                "Please log in to MITAOE Unified ERP to review and take action on this requisition."
            },
            organization
          );

          await sendEmail({
            to: nextUser.email,
            subject: "MITAOE | Canteen Requisition Pending Approval",
            html: htmlNext
          });
        }
      }

      // Notify canteen owner when order is fully approved and ready for preparation
      if (action === "approve" && req.status === "APPROVED_DIRECTOR") {
        const canteenOwner = await User.findOne({
          organizationId: orgId,
          role: "canteen_owner"
        }).lean();
        if (canteenOwner && canteenOwner.email) {
          const htmlCanteen = canteenOwnerOrderTemplate(
            reqObj,
            "ready",
            organization
          );
          await sendEmail({
            to: canteenOwner.email,
            subject: "MITAOE | New Order Ready for Preparation",
            html: htmlCanteen
          });
        }
      }
    } catch (emailError) {
      console.error("[Requisition Service] Error sending status update emails:", emailError);
    }
  })();

  return req;
};

export const addComment = async ({ orgId, reqId, content, user }) => {
  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  });

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  if (!canEdit(req, user)) {
    const error = new Error("You cannot add comments at this stage");
    error.status = 403;
    throw error;
  }

  const commenter = await User.findById(user.sub).lean();
  req.comments = req.comments || [];
  req.comments.push({
    authorId: user.sub,
    authorName: commenter?.name || user.email,
    authorRole: user.role,
    content: content || "",
    createdAt: new Date()
  });
  await req.save();
  return req;
};

export const markPrepared = async ({ orgId, reqId, billing, user }) => {
  if (user.role !== "canteen_owner" && user.role !== "org_admin" && user.role !== "super_admin") {
    const error = new Error("Only canteen can mark requisitions as prepared");
    error.status = 403;
    throw error;
  }

  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  });

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  if (isTerminalRequisitionStatus(req.status)) {
    const error = new Error(`Cannot prepare a requisition that is ${req.status}`);
    error.status = 409;
    throw error;
  }

  if (req.status !== "APPROVED_DIRECTOR") {
    const error = new Error("Only fully approved requisitions can be marked as prepared");
    error.status = 409;
    throw error;
  }

  const fromStatus = req.status;
  req.status = "PREPARED";
  req.approvals = req.approvals || [];
  req.approvals.push({
    stepOrder: req.approvals.length + 1,
    role: user.role,
    label: "fulfillment prepared",
    approverId: user.sub,
    approverName: user.email,
    status: "approved",
    action: "prepare",
    fromStatus,
    toStatus: "PREPARED",
    timestamp: new Date()
  });
  if (billing && billing.items && billing.totalAmount != null) {
    req.billing = {
      totalAmount: billing.totalAmount,
      currency: billing.currency || "INR",
      items: billing.items,
      generatedAt: new Date()
    };
  }
  await req.save();

  const reqObj = req.toObject ? req.toObject() : req;

  // Notify requester only – HOD/Registrar/Director get only approval mails (asynchronous in background)
  (async () => {
    try {
      if (req.requesterEmail) {
        const [requesterUser, organization] = await Promise.all([
          User.findOne({ _id: req.requesterId }).lean(),
          Organization.findById(orgId).lean()
        ]);

        const r = requesterUser ? { user: requesterUser, email: req.requesterEmail } : null;
        if (r) {
          const html = canteenRequisitionFulfilmentTemplate(
            reqObj,
            r.user,
            "prepared",
            organization
          );
          await sendEmail({
            to: r.email,
            subject: "MITAOE Canteen Requisition Prepared",
            html
          });
        }
      }
    } catch (emailError) {
      console.error("[Requisition Service] Error sending prepared emails:", emailError);
    }
  })();

  return req;
};

export const handOver = async ({ orgId, reqId, peonName, peonPhone, billing, user }) => {
  if (user.role !== "canteen_owner" && user.role !== "org_admin" && user.role !== "super_admin") {
    const error = new Error("Only canteen can hand over orders");
    error.status = 403;
    throw error;
  }

  const req = await Requisition.findOne({
    _id: reqId,
    organizationId: orgId
  });

  if (!req) {
    const error = new Error("Requisition not found");
    error.status = 404;
    throw error;
  }

  if (isTerminalRequisitionStatus(req.status)) {
    const error = new Error(`Cannot hand over a requisition that is ${req.status}`);
    error.status = 409;
    throw error;
  }

  if (req.status !== "PREPARED") {
    const error = new Error("Order must be marked as prepared before hand over");
    error.status = 409;
    throw error;
  }

  if (!peonName || !peonPhone) {
    const error = new Error("Peon name and phone are required");
    error.status = 400;
    throw error;
  }

  const fromStatus = req.status;
  req.status = "HANDED_OVER";
  req.peonName = peonName;
  req.peonPhone = peonPhone;
  req.handedOverAt = new Date();
  req.approvals = req.approvals || [];
  req.approvals.push({
    stepOrder: req.approvals.length + 1,
    role: user.role,
    label: "fulfillment handed over",
    approverId: user.sub,
    approverName: user.email,
    status: "approved",
    action: "handover",
    fromStatus,
    toStatus: "HANDED_OVER",
    timestamp: new Date()
  });

  if (billing && billing.items && billing.totalAmount != null) {
    req.billing = {
      totalAmount: billing.totalAmount,
      currency: billing.currency || "INR",
      items: billing.items,
      generatedAt: new Date()
    };
  } else if (!req.billing && req.items?.length) {
    const items = req.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: 0,
      amount: 0
    }));
    req.billing = {
      totalAmount: 0,
      currency: "INR",
      items,
      generatedAt: new Date()
    };
  }
  await req.save();

  const reqObj = req.toObject ? req.toObject() : req;

  // Notify requester with peon name/phone; notify canteen owner (asynchronous in background)
  (async () => {
    try {
      const [requesterUser, organization, canteenOwner] = await Promise.all([
        User.findOne({ _id: req.requesterId }).lean(),
        Organization.findById(orgId).lean(),
        User.findOne({ organizationId: orgId, role: "canteen_owner" }).lean()
      ]);

      if (req.requesterEmail && requesterUser) {
        const html = canteenRequisitionFulfilmentTemplate(
          reqObj,
          requesterUser,
          "delivered",
          organization,
          { peonName: req.peonName, peonPhone: req.peonPhone }
        );
        await sendEmail({
          to: req.requesterEmail,
          subject: "MITAOE Canteen Requisition Delivered",
          html
        });
      }

      if (canteenOwner && canteenOwner.email) {
        const htmlCanteen = canteenOwnerOrderTemplate(
          reqObj,
          "delivered",
          organization,
          { peonName: req.peonName, peonPhone: req.peonPhone }
        );
        await sendEmail({
          to: canteenOwner.email,
          subject: "MITAOE | Order Delivered",
          html: htmlCanteen
        });
      }
    } catch (emailError) {
      console.error("[Requisition Service] Error sending delivered emails:", emailError);
    }
  })();

  return req;
};
