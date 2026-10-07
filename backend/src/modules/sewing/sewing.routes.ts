import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import {
  getSewingOrderController,
  getSewingQueueController,
} from "./sewing.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("sewing_supervisor"));

router.get(
  "/queue",
  getSewingQueueController,
);

router.get(
  "/:id",
  getSewingOrderController,
);

export default router;