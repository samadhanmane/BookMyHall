import { Router } from "express";
import {
  bookingAnalytics,
  canteenAnalytics,
  maintenanceAnalytics,
  overviewAnalytics,
  userAnalytics,
} from "../controllers/analyticsController.js";
import { authMiddleware, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router({ mergeParams: true });

// All analytics routes require authentication
router.use(authMiddleware);

// Combined overview (any authenticated org user)
router.get("/overview", overviewAnalytics);

// Module-specific analytics
router.get("/bookings", requirePermission(PERMISSIONS.BOOKING_VIEW), bookingAnalytics);
router.get("/canteen", requirePermission(PERMISSIONS.CANTEEN_VIEW), canteenAnalytics);
router.get("/maintenance", requirePermission(PERMISSIONS.MAINTENANCE_VIEW), maintenanceAnalytics);

// Personal analytics (any authenticated user)
router.get("/me", userAnalytics);

export default router;
