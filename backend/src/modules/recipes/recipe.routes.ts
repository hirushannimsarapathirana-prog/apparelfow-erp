import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  createRecipeController,
  getRecipeController,
  listRecipesController,
  updateRecipeController,
} from "./recipe.controller.js";
import {
  createRecipeSchema,
  recipeIdSchema,
  updateRecipeSchema,
} from "./recipe.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", listRecipesController);

router.get(
  "/:id",
  validate(recipeIdSchema),
  getRecipeController,
);

router.post(
  "/",
  requireRole("cutting_supervisor"),
  validate(createRecipeSchema),
  createRecipeController,
);

router.put(
  "/:id",
  requireRole("cutting_supervisor"),
  validate(updateRecipeSchema),
  updateRecipeController,
);

export default router;