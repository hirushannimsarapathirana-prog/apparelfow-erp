import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    recipeId: z.string().uuid(),
    targetQty: z.number().int().positive(),
    fabricRollId: z.string().trim().min(1).optional(),
    actualFabricYds: z.number().nonnegative(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const orderIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});