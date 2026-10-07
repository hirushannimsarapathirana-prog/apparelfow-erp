import bcrypt from "bcryptjs";
import prisma from "../../config/database.js";

export async function seedUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await prisma.user.createMany({
    data: [
      {
        email: "supervisor@apparelfow.com",
        passwordHash,
        role: "cutting_supervisor",
        fullName: "Cutting Supervisor",
      },
      {
        email: "verifier@apparelfow.com",
        passwordHash,
        role: "cutting_verifier",
        fullName: "Cutting Verifier",
      },
      {
        email: "sewing@apparelfow.com",
        passwordHash,
        role: "sewing_supervisor",
        fullName: "Sewing Supervisor",
      },
    ],
    skipDuplicates: true,
  });
}