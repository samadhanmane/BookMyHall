import { Router } from "express";
import { listUsers, createUser, updateUser, deleteUser, updateSelfProfile } from "../controllers/userController.js";
import { authMiddleware, requireOrgAccess, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(requireOrgAccess);

router.get("/", requirePermission(PERMISSIONS.USERS_MANAGE), listUsers);
router.post("/", requirePermission(PERMISSIONS.USERS_MANAGE), createUser);
router.put("/me/profile", updateSelfProfile);
router.put("/:userId", requirePermission(PERMISSIONS.USERS_MANAGE), updateUser);
router.delete("/:userId", requirePermission(PERMISSIONS.USERS_MANAGE), deleteUser);

export default router;


