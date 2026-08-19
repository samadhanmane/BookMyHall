import { Router } from "express";
import {
  listTickets,
  getTicket,
  createTicket,
  addComment,
  act,
  listWorkers,
  createWorker,
  updateWorkerProgress
} from "../controllers/maintenanceController.js";
import { authMiddleware, requireOrgAccess, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/permissions.js";
import { maintenanceCreateLimiter } from "../middleware/rateLimit.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(requireOrgAccess);

router.get("/", requirePermission(PERMISSIONS.MAINTENANCE_VIEW), listTickets);
// Workshop worker management (must stay before "/:ticketId")
router.get(
  "/workers",
  requirePermission(PERMISSIONS.MAINTENANCE_WORKER_MANAGE),
  listWorkers
);
router.post(
  "/workers",
  requirePermission(PERMISSIONS.MAINTENANCE_WORKER_MANAGE),
  createWorker
);

router.get(
  "/:ticketId",
  requirePermission(PERMISSIONS.MAINTENANCE_VIEW),
  getTicket
);

// Create ticket (staff)
router.post(
  "/",
  maintenanceCreateLimiter,
  requirePermission(PERMISSIONS.MAINTENANCE_CREATE),
  createTicket
);

// Add comment (any allowed role who can access ticket)
router.post(
  "/:ticketId/comments",
  requirePermission(PERMISSIONS.MAINTENANCE_VIEW),
  addComment
);

// Act on ticket (approve/reject/mark purchase/assign/complete)
router.post(
  "/:ticketId/actions",
  requirePermission(PERMISSIONS.MAINTENANCE_ACT, PERMISSIONS.MAINTENANCE_CREATE),
  act
);

router.patch(
  "/:ticketId/worker-progress",
  requirePermission(PERMISSIONS.MAINTENANCE_VIEW),
  updateWorkerProgress
);

export default router;

