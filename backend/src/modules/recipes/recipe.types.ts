import { Prisma } from "@prisma/client";

export type RecipeWithComponents = Prisma.RecipeGetPayload<{
  include: {
    components: true;
  };
}>;

export interface CreateRecipeInput {
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: {
    componentName: string;
    piecesPerGarment: number;
    imageUrl?: string;
  }[];
}

export interface UpdateRecipeInput {
  name?: string;
  category?: string;
  stdFabricYards?: number;
  wastageCap?: number;
  components?: {
    componentName: string;
    piecesPerGarment: number;
    imageUrl?: string;
  }[];
}