import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/config/database.js";
import {
  createTestToken,
  getTestUser,
} from "./test-helpers.js";

describe("RBAC integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("cutting supervisor cannot approve verification", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );

    const token = createTestToken(supervisor);

    const fakeOrderId =
      "00000000-0000-0000-0000-000000000001";

    const response = await request(app)
      .post(`/api/verification/${fakeOrderId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.status).toBe(403);
  });

  test("cutting supervisor cannot access sewing queue", async () => {
    const supervisor = await getTestUser(
      "supervisor@apparelfow.com",
    );

    const token = createTestToken(supervisor);

    const response = await request(app)
      .get("/api/sewing/queue")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  test("sewing supervisor cannot approve verification", async () => {
    const sewingSupervisor = await getTestUser(
      "sewing@apparelfow.com",
    );

    const token = createTestToken(sewingSupervisor);

    const fakeOrderId =
      "00000000-0000-0000-0000-000000000001";

    const response = await request(app)
      .post(`/api/verification/${fakeOrderId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.status).toBe(403);
  });
});