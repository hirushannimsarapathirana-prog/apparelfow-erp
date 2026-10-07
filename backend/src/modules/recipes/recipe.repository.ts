import prisma from "../../config/database.js";
import { Prisma } from "@prisma/client";

export async function findAllRecipes() {
  return prisma.recipe.findMany({
    include: {
      components: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function findRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      components: true,
    },
  });
}

export async function findRecipeByCode(recipeCode: string) {
  return prisma.recipe.findUnique({
    where: { recipeCode },
  });
}

export async function createRecipe(
  data: Prisma.RecipeCreateInput,
) {
  return prisma.recipe.create({
    data,
    include: {
      components: true,
    },
  });
}

export async function updateRecipe(
  id: string,
  data: Prisma.RecipeUpdateInput,
) {
  return prisma.recipe.update({
    where: { id },
    data,
    include: {
      components: true,
    },
  });
}