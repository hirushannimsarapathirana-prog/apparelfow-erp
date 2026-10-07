import prisma from "../../config/database.js";
import { UserSummary } from "./user.types.js";
import { userSummarySelect } from "./user.model.js";

export async function getUserById(
  userId: string,
): Promise<UserSummary | null> {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: userSummarySelect,
  });
}

export async function getUserByEmail(
  email: string,
): Promise<UserSummary | null> {
  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
    select: userSummarySelect,
  });
}