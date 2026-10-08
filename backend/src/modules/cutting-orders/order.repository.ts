import prisma from "../../config/database.js";

export async function findOrderById(id: string) {
  return prisma.cuttingOrder.findUnique({
    where: { id },
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

export async function findOrders() {
  return prisma.cuttingOrder.findMany({
    include: {
      recipe: true,
      verificationItems: {
        include: {
          component: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createOrder(
  data: Parameters<
    typeof prisma.cuttingOrder.create
  >[0]["data"],
) {
  return prisma.cuttingOrder.create({
    data,
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

export async function updateOrderStatus(
  id: string,
  status: "PENDING_VERIFICATION" | "COUNT_QC",
) {
  return prisma.cuttingOrder.update({
    where: { id },
    data: { status },
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