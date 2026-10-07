import prisma from "../../config/database.js";
import {
  canApproveVerification,
  getVerificationStatus,
  validateApproval,
  validateRejectionReason,
} from "../../domain/verification-rules.js";
import {
  calculateExpectedFabric,
  calculateWastagePercentage,
} from "../../domain/wastage-calculator.js";
import {
  findOrderForVerification,
  updateVerificationItems,
} from "./verification.repository.js";
import {
  RejectionInput,
  VerificationSubmissionInput,
} from "./verification.types.js";

export async function getVerificationOrder(
  orderId: string,
) {
  const order = await findOrderForVerification(orderId);

  if (!order) {
    throw new Error("Cutting order not found");
  }

  return order;
}

export async function updateVerification(
  orderId: string,
  input: VerificationSubmissionInput,
) {
  const order = await findOrderForVerification(orderId);

  if (!order) {
    throw new Error("Cutting order not found");
  }

  if (
    order.status !== "PENDING_VERIFICATION" &&
    order.status !== "COUNT_QC"
  ) {
    throw new Error(
      "This order is not available for verification",
    );
  }

  const expectedComponentIds =
    new Set(
      order.verificationItems.map(
        (item) => item.componentId,
      ),
    );

  const submittedIds = new Set(
    input.items.map((item) => item.componentId),
  );

  for (const item of input.items) {
    if (!expectedComponentIds.has(item.componentId)) {
      throw new Error(
        "Invalid component for this cutting order",
      );
    }
  }

  if (
    submittedIds.size !==
    expectedComponentIds.size
  ) {
    throw new Error(
      "All recipe components must be counted",
    );
  }

  const updatedItems = input.items.map((inputItem) => {
    const existingItem =
      order.verificationItems.find(
        (item) =>
          item.componentId === inputItem.componentId,
      );

    if (!existingItem) {
      throw new Error(
        "Verification component not found",
      );
    }

    return {
      componentId: inputItem.componentId,
      actualQty: inputItem.actualQty,
      status: getVerificationStatus(
        Number(existingItem.expectedQty),
        inputItem.actualQty,
      ),
    };
  });

  await updateVerificationItems(
    orderId,
    updatedItems,
  );

  await prisma.cuttingOrder.update({
    where: {
      id: orderId,
    },
    data: {
      status: "COUNT_QC",
    },
  });

  return findOrderForVerification(orderId);
}

export async function approveVerification(
  orderId: string,
  verifierId: string,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.cuttingOrder.findUnique({
      where: {
        id: orderId,
      },
      include: {
        verificationItems: true,
        recipe: true,
      },
    });

    if (!order) {
      throw new Error("Cutting order not found");
    }

    if (order.status !== "COUNT_QC") {
      throw new Error(
        "Order must be in COUNT_QC before approval",
      );
    }

    const statuses = order.verificationItems.map(
      (item) => item.status,
    );

    if (
      order.verificationItems.length === 0 ||
      order.verificationItems.some(
        (item) => item.actualQty === null,
      )
    ) {
      throw new Error(
        "Verification cannot be approved: all components must be counted.",
      );
    }

    validateApproval(statuses);

    if (!canApproveVerification(statuses)) {
      throw new Error(
        "Verification cannot be approved.",
      );
    }

    if (order.actualFabricYds === null) {
      throw new Error(
        "Actual fabric usage is required.",
      );
    }

    const expectedFabric = calculateExpectedFabric(
      Number(order.recipe.stdFabricYards),
      order.targetQty,
    );

    const wastagePct = calculateWastagePercentage(
      Number(order.actualFabricYds),
      expectedFabric,
    );

    const updatedOrder = await tx.cuttingOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "VERIFIED",
      },
      include: {
        recipe: true,
        verificationItems: {
          include: {
            component: true,
          },
        },
      },
    });

    await tx.verificationLog.create({
      data: {
        order: {
          connect: {
            id: orderId,
          },
        },
        verifier: {
          connect: {
            id: verifierId,
          },
        },
        decision: "APPROVED",
        wastagePct,
      },
    });

    return updatedOrder;
  });
}

export async function rejectVerification(
  orderId: string,
  verifierId: string,
  input: RejectionInput,
) {
  validateRejectionReason(input.rejectionReason);

  return prisma.$transaction(async (tx) => {
    const order = await tx.cuttingOrder.findUnique({
      where: {
        id: orderId,
      },
      include: {
        verificationItems: true,
      },
    });

    if (!order) {
      throw new Error("Cutting order not found");
    }

    if (order.status !== "COUNT_QC") {
      throw new Error(
        "Order must be in COUNT_QC before rejection",
      );
    }

    const updatedOrder = await tx.cuttingOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "REJECTED",
      },
      include: {
        recipe: true,
        verificationItems: {
          include: {
            component: true,
          },
        },
      },
    });

    await tx.verificationLog.create({
      data: {
        order: {
          connect: {
            id: orderId,
          },
        },
        verifier: {
          connect: {
            id: verifierId,
          },
        },
        decision: "REJECTED",
        rejectionNote: input.rejectionReason.trim(),
      },
    });

    return updatedOrder;
  });
}