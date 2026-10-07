import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import {
  createTestToken,
  getTestUser,
  cleanupTestOrder,
} from "./test-helpers.js";

describe("Verification approval integration", () => {
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

  test("GREEN components can be approved successfully", async () => {
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
    expect(recipe!.components.length).toBeGreaterThan(0);

    const createResponse = await request(app)
      .post("/api/cutting-orders")
      .set(
        "Authorization",
        `Bearer ${supervisorToken}`,
      )
      .send({
        recipeId: recipe!.id,
        targetQty: 10,
        fabricRollId: "TEST-ROLL-APPROVAL",
        actualFabricYds: 18,
      });

    expect(createResponse.status).toBe(201);

    orderId = createResponse.body.data.id;

    const submitResponse = await request(app)
      .post(
        `/api/cutting-orders/${orderId}/submit`,
      )
      .set(
        "Authorization",
        `Bearer ${supervisorToken}`,
      )
      .send({});

    expect(submitResponse.status).toBe(200);

    const items = recipe!.components.map(
      (component) => ({
        componentId: component.id,
        actualQty:
          Number(component.piecesPerGarment) * 10,
      }),
    );

    const updateResponse = await request(app)
      .put(
        `/api/verification/${orderId}/items`,
      )
      .set(
        "Authorization",
        `Bearer ${verifierToken}`,
      )
      .send({
        items,
      });

    expect(updateResponse.status).toBe(200);

    const approveResponse = await request(app)
      .post(
        `/api/verification/${orderId}/approve`,
      )
      .set(
        "Authorization",
        `Bearer ${verifierToken}`,
      )
      .send({});

    expect(approveResponse.status).toBe(200);

    expect(
      approveResponse.body.data.status,
    ).toBe("VERIFIED");
  });

  test("RED component blocks approval with 422", async () => {
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
      .set(
        "Authorization",
        `Bearer ${supervisorToken}`,
      )
      .send({
        recipeId: recipe!.id,
        targetQty: 10,
        fabricRollId: "TEST-ROLL-RED",
        actualFabricYds: 18,
      });

    expect(createResponse.status).toBe(201);

    orderId = createResponse.body.data.id;

    const submitResponse = await request(app)
      .post(
        `/api/cutting-orders/${orderId}/submit`,
      )
      .set(
        "Authorization",
        `Bearer ${supervisorToken}`,
      )
      .send({});

    expect(submitResponse.status).toBe(200);

    const items = recipe!.components.map(
      (component, index) => ({
        componentId: component.id,
        actualQty:
          index === 0
            ? Number(component.piecesPerGarment) * 10 - 1
            : Number(component.piecesPerGarment) * 10,
      }),
    );

    const updateResponse = await request(app)
      .put(
        `/api/verification/${orderId}/items`,
      )
      .set(
        "Authorization",
        `Bearer ${verifierToken}`,
      )
      .send({
        items,
      });

    expect(updateResponse.status).toBe(200);

    const approveResponse = await request(app)
      .post(
        `/api/verification/${orderId}/approve`,
      )
      .set(
        "Authorization",
        `Bearer ${verifierToken}`,
      )
      .send({});

    expect(approveResponse.status).toBe(422);

    const order = await prisma.cuttingOrder.findUnique({
      where: {
        id: orderId,
      },
    });

    expect(order?.status).not.toBe("VERIFIED");
  });
});
