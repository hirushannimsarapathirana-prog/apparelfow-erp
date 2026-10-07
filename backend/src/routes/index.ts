import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import recipeRoutes from "../modules/recipes/recipe.routes.js";
import cuttingOrderRoutes from "../modules/cutting-orders/order.routes.js";
import verificationRoutes from "../modules/verification/verification.routes.js";
import sewingRoutes from "../modules/sewing/sewing.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/recipes", recipeRoutes);
router.use("/cutting-orders", cuttingOrderRoutes);
router.use("/verification", verificationRoutes);
router.use("/sewing", sewingRoutes);

export default router;