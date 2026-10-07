import { Prisma } from "@prisma/client";

export type CuttingOrderWithDetails =
  Prisma.CuttingOrderGetPayload<{
    include: {
      recipe: {
        include: {
          components: true;
        };
      };
      verificationItems: {
        include: {
          component: true;
        };
      };
    };
  }>;

export interface CreateCuttingOrderInput {
  recipeId: string;
  targetQty: number;
  fabricRollId?: string;
  actualFabricYds: number;
}