import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import {
  createTestToken,
  getTestUser,
  cleanupTestOrder,
} from "./test-helpers.js";

describe("Verification rejection integration", () => {
  let orderId = "";

  afterEach(async () => {
    if (orderId) {
      await cleanupTestOrder(orderId);
      orderId = "";
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("rejection without reason returns 422", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );
    const verifier = await getTestUser(
      "verifier@apparelfow.com",
    );

    const supervisorToken = createTestToken(supervisor);
    const verifierToken = createTestToken(verifier);

    const recipe = await prisma.recipe.findUnique({
      where: {
        recipeCode: "REC-BL01",
      },
      include: {
        components: true,
      },
    });

    expect(recipe).not.toBeNull();

    const createResponse = await request(app)
      .post("/api/cutting-orders")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        recipeId: recipe!.id,
        targetQty: 10,
        fabricRollId: "TEST-ROLL-REJECT",
        actualFabricYds: 18,
      });

    expect(createResponse.status).toBe(201);

    orderId = createResponse.body.data.id;

    await request(app)
      .post(`/api/cutting-orders/${orderId}/submit`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send();

    const items = recipe!.components.map((component) => ({
      componentId: component.id,
      actualQty:
        Number(component.piecesPerGarment) * 10,
    }));

    await request(app)
      .put(`/api/verification/${orderId}/items`)
      .set("Authorization", `Bearer ${verifierToken}`)
      .send({ items });

    const response = await request(app)
      .post(`/api/verification/${orderId}/reject`)
      .set("Authorization", `Bearer ${verifierToken}`)
      .send({
        rejectionReason: "",
      });

    expect(response.status).toBe(422);

    const order = await prisma.cuttingOrder.findUnique({
      where: { id: orderId },
    });

    expect(order?.status).toBe("COUNT_QC");
  });

  test("rejection with reason changes order to REJECTED", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );
    const verifier = await getTestUser(
      "verifier@apparelfow.com",
    );

    const supervisorToken = createTestToken(supervisor);
    const verifierToken = createTestToken(verifier);

    const recipe = await prisma.recipe.findUnique({
      where: {
        recipeCode: "REC-BL01",
      },
      include: {
        components: true,
      },
    });

    expect(recipe).not.toBeNull();

    const createResponse = await request(app)
      .post("/api/cutting-orders")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        recipeId: recipe!.id,
        targetQty: 10,
        fabricRollId: "TEST-ROLL-REJECT-VALID",
        actualFabricYds: 18,
      });

    expect(createResponse.status).toBe(201);

    orderId = createResponse.body.data.id;

    await request(app)
      .post(`/api/cutting-orders/${orderId}/submit`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send();

    const items = recipe!.components.map((component) => ({
      componentId: component.id,
      actualQty:
        Number(component.piecesPerGarment) * 10,
    }));

    await request(app)
      .put(`/api/verification/${orderId}/items`)
      .set("Authorization", `Bearer ${verifierToken}`)
      .send({ items });

    const response = await request(app)
      .post(`/api/verification/${orderId}/reject`)
      .set("Authorization", `Bearer ${verifierToken}`)
      .send({
        rejectionReason: "Fabric component shortage",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("REJECTED");
  });
});