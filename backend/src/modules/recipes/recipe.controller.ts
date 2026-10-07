import { Request, Response } from "express";
import {
  createNewRecipe,
  getRecipe,
  listRecipes,
  updateExistingRecipe,
} from "./recipe.service.js";

export async function listRecipesController(
  _req: Request,
  res: Response,
): Promise<void> {
  const recipes = await listRecipes();

  res.status(200).json({
    success: true,
    data: recipes,
  });
}

export async function getRecipeController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const recipe = await getRecipe(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get recipe";

    if (message === "Recipe not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}

export async function createRecipeController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const recipe = await createNewRecipe(req.body);

    res.status(201).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create recipe";

    if (message === "Recipe code already exists") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}

export async function updateRecipeController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
const recipe = await updateExistingRecipe(
  req.params.id as string,
  req.body,
);

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update recipe";

    if (message === "Recipe not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    throw error;
  }
}