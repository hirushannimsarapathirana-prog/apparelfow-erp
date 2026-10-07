import { Request, Response } from "express";
import { login } from "./auth.service.js";
import { LoginInput } from "./auth.types.js";

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await login(req.body as LoginInput);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    if (message === "Invalid email or password") {
      res.status(401).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}