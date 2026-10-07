import { Router } from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { loginController } from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  loginController,
);

export default router;