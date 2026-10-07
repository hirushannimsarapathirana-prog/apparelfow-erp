import { Prisma } from "@prisma/client";

export const userSummarySelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
} satisfies Prisma.UserSelect;