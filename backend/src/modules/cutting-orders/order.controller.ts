import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  createCuttingOrder,
  getCuttingOrder,
  listCuttingOrders,
  submitOrderForVerification,
} from "./order.service.js";

export async function listOrdersController(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orders = await listCuttingOrders();

  res.status(200).json({
    success: true,
    data: orders,
  });
}

export async function getOrderController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const order = await getCuttingOrder(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get cutting order";

    if (message === "Cutting order not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}

export async function createOrderController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const order = await createCuttingOrder(
      req.body,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create cutting order";

    if (
      message === "Recipe not found" ||
      message ===
        "Actual fabric used must be greater than zero"
    ) {
      res.status(422).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}

export async function submitOrderController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const order = await submitOrderForVerification(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit order";

    if (message === "Cutting order not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message ===
      "Only cutting orders in progress can be submitted"
    ) {
      res.status(422).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}