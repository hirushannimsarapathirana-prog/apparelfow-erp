import prisma from "../../config/database.js";
import {
  calculateExpectedComponentQuantity,
} from "../../domain/component-calculator.js";
import {
  CreateCuttingOrderInput,
} from "./order.types.js";
import {
  createOrder,
  findOrderById,
  findOrders,
  updateOrderStatus,
} from "./order.repository.js";

function generateOrderNumber(): string {
  const timestamp = Date.now();

  return `CUT-${timestamp}`;
}

export async function listCuttingOrders() {
  return findOrders();
}

export async function getCuttingOrder(id: string) {
  const order = await findOrderById(id);

  if (!order) {
    throw new Error("Cutting order not found");
  }

  return order;
}

export async function createCuttingOrder(
  input: CreateCuttingOrderInput,
  createdBy: string,
) {
  const recipe = await prisma.recipe.findUnique({
    where: {
      id: input.recipeId,
    },
    include: {
      components: true,
    },
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  if (input.actualFabricYds <= 0) {
    throw new Error(
      "Actual fabric used must be greater than zero",
    );
  }

  const verificationItems = recipe.components.map(
    (component) => ({
      componentId: component.id,
      expectedQty:
        calculateExpectedComponentQuantity(
          Number(component.piecesPerGarment),
          input.targetQty,
        ),
      actualQty: null,
      status: "RED" as const,
    }),
  );

  return createOrder({
    orderNo: generateOrderNumber(),
    recipe: {
      connect: {
        id: recipe.id,
      },
    },
    targetQty: input.targetQty,
    fabricRollId: input.fabricRollId,
    actualFabricYds: input.actualFabricYds,
    status: "CUTTING_IN_PROGRESS",
    creator: {
      connect: {
        id: createdBy,
      },
    },
    verificationItems: {
      create: verificationItems,
    },
  });
}

export async function submitOrderForVerification(
  id: string,
) {
  const order = await findOrderById(id);

  if (!order) {
    throw new Error("Cutting order not found");
  }

  if (order.status !== "CUTTING_IN_PROGRESS") {
    throw new Error(
      "Only cutting orders in progress can be submitted",
    );
  }

  return updateOrderStatus(
    id,
    "PENDING_VERIFICATION",
  );
}