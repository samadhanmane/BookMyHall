import { Router } from "express";
import {
  listOrganizations,
  getOrganization,
  getPlatformStats,
  getChatbotUsageStats,
  createOrganization,
  deleteOrganization
} from "../controllers/organizationController.js";
import { authMiddleware, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();

router.get("/", listOrganizations);

router.get(
  "/stats/platform",
  authMiddleware,
  requirePermission(PERMISSIONS.ORG_MANAGE),
  getPlatformStats
);

router.get(
  "/stats/chatbot-usage",
  authMiddleware,
  requirePermission(PERMISSIONS.ORG_MANAGE),
  getChatbotUsageStats
);

router.get("/:orgId/public", getOrganization);

router.post("/", authMiddleware, requirePermission(PERMISSIONS.ORG_MANAGE), createOrganization);
router.delete("/:orgId", authMiddleware, requirePermission(PERMISSIONS.ORG_MANAGE), deleteOrganization);

export default router;


