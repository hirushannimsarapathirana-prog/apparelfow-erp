import prisma from "../../config/database.js";

export async function seedRecipes(): Promise<void> {
  const recipes = [
    {
      recipeCode: "REC-BL01",
      name: "Casual Blouse",
      category: "Blouse",
      stdFabricYards: 1.8,
      wastageCap: 5,
      components: [
        {
          componentName: "Front Body Panel",
          piecesPerGarment: 1,
        },
        {
          componentName: "Back Body Panel",
          piecesPerGarment: 1,
        },
        {
          componentName: "Sleeves Left/Right",
          piecesPerGarment: 2,
        },
        {
          componentName: "Collar & Stand",
          piecesPerGarment: 1,
        },
        {
          componentName: "Sleeve Cuffs",
          piecesPerGarment: 2,
        },
      ],
    },
    {
      recipeCode: "REC-CT02",
      name: "Crop Top",
      category: "Crop Top",
      stdFabricYards: 1.1,
      wastageCap: 8,
      components: [
        {
          componentName: "Front Chest Panel",
          piecesPerGarment: 1,
        },
        {
          componentName: "Back Support Panel",
          piecesPerGarment: 1,
        },
        {
          componentName: "Neck Binding Strip",
          piecesPerGarment: 1,
        },
        {
          componentName: "Hem Elastic Casing",
          piecesPerGarment: 1,
        },
        {
          componentName: "Side Strap Accents",
          piecesPerGarment: 2,
        },
      ],
    },
  ];

  for (const recipeData of recipes) {
    const { components, ...recipe } = recipeData;

    await prisma.recipe.upsert({
      where: {
        recipeCode: recipe.recipeCode,
      },
      update: {
        name: recipe.name,
        category: recipe.category,
        stdFabricYards: recipe.stdFabricYards,
        wastageCap: recipe.wastageCap,
      },
      create: {
        ...recipe,
        components: {
          create: components,
        },
      },
    });
  }
}