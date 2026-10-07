import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  approveVerification,
  getVerificationOrder,
  rejectVerification,
  updateVerification,
} from "./verification.service.js";

export async function getVerificationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const order = await getVerificationOrder(
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
        : "Failed to load verification";

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

export async function updateVerificationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const order = await updateVerification(
      req.params.id as string,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update verification";

    if (message === "Cutting order not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(422).json({
      success: false,
      message,
    });
  }
}

export async function approveVerificationController(
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

    const order = await approveVerification(
      req.params.id as string,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Verification approval failed";

    if (message === "Cutting order not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(422).json({
      success: false,
      message,
    });
  }
}

export async function rejectVerificationController(
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

    const order = await rejectVerification(
      req.params.id as string,
      req.user.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Verification rejection failed";

    if (message === "Cutting order not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(422).json({
      success: false,
      message,
    });
  }
}