import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  createOrderController,
  getOrderController,
  listOrdersController,
  submitOrderController,
} from "./order.controller.js";
import {
  createOrderSchema,
  orderIdSchema,
} from "./order.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requireRole(
    "cutting_supervisor",
    "cutting_verifier",
  ),
  listOrdersController,
);

router.get(
  "/:id",
  requireRole(
    "cutting_supervisor",
    "cutting_verifier",
  ),
  validate(orderIdSchema),
  getOrderController,
);

router.post(
  "/",
  requireRole("cutting_supervisor"),
  validate(createOrderSchema),
  createOrderController,
);

router.post(
  "/:id/submit",
  requireRole("cutting_supervisor"),
  validate(orderIdSchema),
  submitOrderController,
);

export default router;