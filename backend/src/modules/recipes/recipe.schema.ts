import { z } from "zod";

const componentSchema = z.object({
  componentName: z.string().trim().min(1),
  piecesPerGarment: z.number().positive(),
  imageUrl: z.string().url().optional(),
});

export const createRecipeSchema = z.object({
  body: z.object({
    recipeCode: z.string().trim().min(1),
    name: z.string().trim().min(1),
    category: z.string().trim().min(1),
    stdFabricYards: z.number().positive(),
    wastageCap: z.number().min(0),
    components: z.array(componentSchema).min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateRecipeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    stdFabricYards: z.number().positive().optional(),
    wastageCap: z.number().min(0).optional(),
    components: z.array(componentSchema).min(1).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});

export const recipeIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});