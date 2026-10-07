import prisma from "../../config/database.js";

export async function findSewingQueue() {
  return prisma.cuttingOrder.findMany({
    where: {
      status: "VERIFIED",
    },
    select: {
      id: true,
      orderNo: true,
      targetQty: true,
      fabricRollId: true,
      actualFabricYds: true,
      status: true,
      createdAt: true,
      recipe: {
        select: {
          id: true,
          recipeCode: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function findVerifiedOrder(
  orderId: string,
) {
  return prisma.cuttingOrder.findFirst({
    where: {
      id: orderId,
      status: "VERIFIED",
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
      verificationLogs: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          verifier: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}