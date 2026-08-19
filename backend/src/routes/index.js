import { Router } from "express";
import authRoutes from "./authRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import utilityRoutes from "./utilityRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import userRoutes from "./userRoutes.js";
import requisitionRoutes from "./requisitionRoutes.js";
import canteenMenuRoutes from "./canteenMenuRoutes.js";
import maintenanceRoutes from "./maintenanceRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import { platformAnalytics } from "../controllers/analyticsController.js";
import { authMiddleware, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/orgs/:orgId/categories", categoryRoutes);
router.use("/orgs/:orgId/utilities", utilityRoutes);
router.use("/orgs/:orgId/bookings", bookingRoutes);
router.use("/orgs/:orgId/users", userRoutes);
router.use("/orgs/:orgId/requisitions", requisitionRoutes);
router.use("/orgs/:orgId/canteen-menu", canteenMenuRoutes);
router.use("/orgs/:orgId/maintenance", maintenanceRoutes);
router.use("/orgs/:orgId/analytics", analyticsRoutes);

// Platform-level analytics (super_admin only)
router.get("/analytics/platform", authMiddleware, requirePermission(PERMISSIONS.ORG_MANAGE), platformAnalytics);

export default router;


