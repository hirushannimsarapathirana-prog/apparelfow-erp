import prisma from "../../config/database.js";

export async function findOrderForVerification(
  orderId: string,
) {
  return prisma.cuttingOrder.findUnique({
    where: {
      id: orderId,
    },
    include: {
      recipe: {
        include: {
          components: true,
        },
      },
      verificationItems: {
        include: {
          component: true,
        },
      },
    },
  });
}

export async function updateVerificationItems(
  orderId: string,
  items: {
    componentId: string;
    actualQty: number;
    status: "GREEN" | "YELLOW" | "RED";
  }[],
) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.verificationItem.update({
        where: {
          orderId_componentId: {
            orderId,
            componentId: item.componentId,
          },
        },
        data: {
          actualQty: item.actualQty,
          status: item.status,
        },
      }),
    ),
  );
}