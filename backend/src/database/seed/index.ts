import prisma from "../../config/database.js";
import { seedRecipes } from "./recipes.seed.js";
import { seedUsers } from "./users.seed.js";

async function main(): Promise<void> {
  console.log("Starting database seed...");

  await seedUsers();
  console.log("Users seeded.");

  await seedRecipes();
  console.log("Recipes seeded.");

  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });