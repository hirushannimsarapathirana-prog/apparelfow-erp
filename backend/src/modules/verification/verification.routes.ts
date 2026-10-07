import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  approveVerificationController,
  getVerificationController,
  rejectVerificationController,
  updateVerificationController,
} from "./verification.controller.js";
import {
  approveVerificationSchema,
  rejectVerificationSchema,
  updateVerificationSchema,
} from "./verification.schema.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("cutting_verifier"));

router.get(
  "/:id",
  getVerificationController,
);

router.put(
  "/:id/items",
  validate(updateVerificationSchema),
  updateVerificationController,
);

router.post(
  "/:id/approve",
  validate(approveVerificationSchema),
  approveVerificationController,
);

router.post(
  "/:id/reject",
  validate(rejectVerificationSchema),
  rejectVerificationController,
);

export default router;