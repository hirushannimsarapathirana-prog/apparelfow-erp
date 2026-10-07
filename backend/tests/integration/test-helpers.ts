import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../src/config/database.js";

export const TEST_PASSWORD = "Password123!";

export async function getTestUser(
  email: string,
  password = TEST_PASSWORD,
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`Test user not found: ${email}`);
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error(`Invalid test password for: ${email}`);
  }

  return user;
}

export function createTestToken(user: {
  id: string;
  role: string;
}) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: "1h",
    },
  );
}

export async function cleanupTestOrder(orderId: string) {
  await prisma.verificationLog.deleteMany({
    where: { orderId },
  });

  await prisma.verificationItem.deleteMany({
    where: { orderId },
  });

  await prisma.cuttingOrder.delete({
    where: { id: orderId },
  });
}