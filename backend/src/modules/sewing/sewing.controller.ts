import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  getSewingOrder,
  getSewingQueue,
} from "./sewing.service.js";

export async function getSewingQueueController(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const queue = await getSewingQueue();

  res.status(200).json({
    success: true,
    data: queue,
  });
}

export async function getSewingOrderController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const order = await getSewingOrder(
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
        : "Failed to get sewing order";

    if (
      message ===
      "Verified cutting order not found"
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}