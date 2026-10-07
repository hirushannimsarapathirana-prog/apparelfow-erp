import { Prisma } from "@prisma/client";
import {
  createRecipe,
  findAllRecipes,
  findRecipeByCode,
  findRecipeById,
  updateRecipe,
} from "./recipe.repository.js";
import {
  CreateRecipeInput,
  UpdateRecipeInput,
} from "./recipe.types.js";

export async function listRecipes() {
  return findAllRecipes();
}

export async function getRecipe(id: string) {
  const recipe = await findRecipeById(id);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  return recipe;
}

export async function createNewRecipe(
  input: CreateRecipeInput,
) {
  const existingRecipe = await findRecipeByCode(
    input.recipeCode,
  );

  if (existingRecipe) {
    throw new Error("Recipe code already exists");
  }

  const data: Prisma.RecipeCreateInput = {
    recipeCode: input.recipeCode,
    name: input.name,
    category: input.category,
    stdFabricYards: input.stdFabricYards,
    wastageCap: input.wastageCap,
    components: {
      create: input.components.map((component) => ({
        componentName: component.componentName,
        piecesPerGarment: component.piecesPerGarment,
        imageUrl: component.imageUrl,
      })),
    },
  };

  return createRecipe(data);
}

export async function updateExistingRecipe(
  id: string,
  input: UpdateRecipeInput,
) {
  const recipe = await findRecipeById(id);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const data: Prisma.RecipeUpdateInput = {
    name: input.name,
    category: input.category,
    stdFabricYards: input.stdFabricYards,
    wastageCap: input.wastageCap,
  };

  if (input.components) {
    data.components = {
      deleteMany: {},
      create: input.components.map((component) => ({
        componentName: component.componentName,
        piecesPerGarment: component.piecesPerGarment,
        imageUrl: component.imageUrl,
      })),
    };
  }

  return updateRecipe(id, data);
}