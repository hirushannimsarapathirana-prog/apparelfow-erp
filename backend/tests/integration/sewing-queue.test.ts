import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import {
  createTestToken,
  getTestUser,
  cleanupTestOrder,
} from "./test-helpers.js";

describe("Sewing queue integration", () => {
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

  test("unverified order never appears in sewing queue", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );

    const sewingSupervisor = await getTestUser(
      "sewing@apparelfow.com",
    );

    const supervisorToken = createTestToken(supervisor);
    const sewingToken = createTestToken(sewingSupervisor);

    const recipe = await prisma.recipe.findUnique({
      where: {
        recipeCode: "REC-BL01",
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
        fabricRollId: "TEST-ROLL-QUEUE",
        actualFabricYds: 18,
      });

    expect(createResponse.status).toBe(201);

    orderId = createResponse.body.data.id;

    const queueResponse = await request(app)
      .get("/api/sewing/queue")
      .set(
        "Authorization",
        `Bearer ${sewingToken}`,
      );

    expect(queueResponse.status).toBe(200);

    const queue = queueResponse.body.data;

    expect(
      queue.some(
        (item: { id: string }) =>
          item.id === orderId,
      ),
    ).toBe(false);
  });

  test("verified order appears in sewing queue", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );

    const verifier = await getTestUser(
      "verifier@apparelfow.com",
    );

    const sewingSupervisor = await getTestUser(
      "sewing@apparelfow.com",
    );

    const supervisorToken = createTestToken(supervisor);
    const verifierToken = createTestToken(verifier);
    const sewingToken = createTestToken(sewingSupervisor);

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
        fabricRollId: "TEST-ROLL-QUEUE-VERIFIED",
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

    const queueResponse = await request(app)
      .get("/api/sewing/queue")
      .set(
        "Authorization",
        `Bearer ${sewingToken}`,
      );

    expect(queueResponse.status).toBe(200);

    const queue = queueResponse.body.data;

    const queuedOrder = queue.find(
      (item: { id: string }) =>
        item.id === orderId,
    );

    expect(queuedOrder).toBeDefined();
    expect(queuedOrder.status).toBe("VERIFIED");
  });
});