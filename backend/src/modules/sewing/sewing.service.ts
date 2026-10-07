import {
  findSewingQueue,
  findVerifiedOrder,
} from "./sewing.repository.js";

export async function getSewingQueue() {
  return findSewingQueue();
}

export async function getSewingOrder(
  orderId: string,
) {
  const order = await findVerifiedOrder(orderId);

  if (!order) {
    throw new Error(
      "Verified cutting order not found",
    );
  }

  return order;
}