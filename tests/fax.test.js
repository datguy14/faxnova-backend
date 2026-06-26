const request = require("supertest");
const app = require("../server");
const Fax = require("../src/models/Fax");

describe("Fax API Tests", () => {
  beforeEach(async () => {
    await Fax.deleteMany({});
  });

  test("Creates fax with valid payload", async () => {
    const res = await request(app)
      .post("/fax/send")
      .send({
        toNumber: "+18885551234",
        fromNumber: "+18885554321",
        tenantId: "tenant1",
        provider: "Sinch"
      });

    expect(res.status).toBe(202);
    expect(res.body.faxId).toBeDefined();

    const fax = await Fax.findOne({ faxId: res.body.faxId });
    expect(fax).not.toBeNull();
    expect(fax.status).toBe("processing");
  });

  test("Rejects invalid phone number", async () => {
    const res = await request(app)
      .post("/fax/send")
      .send({
        toNumber: "12345",
        fromNumber: "+18885554321",
        tenantId: "tenant1",
        provider: "Sinch"
      });

    expect(res.status).toBe(400);
  });

  test("Idempotent send with same faxId", async () => {
    const faxId = "fax_test_123";

    await request(app)
      .post("/fax/send")
      .send({
        faxId,
        toNumber: "+18885551234",
        fromNumber: "+18885554321",
        tenantId: "tenant1",
        provider: "Sinch"
      });

    const res2 = await request(app)
      .post("/fax/send")
      .send({
        faxId,
        toNumber: "+18885551234",
        fromNumber: "+18885554321",
        tenantId: "tenant1",
        provider: "Sinch"
      });

    expect(res2.status).toBe(200);
    expect(res2.body.faxId).toBe(faxId);
  });

  test("Retry increments retry count", async () => {
    const fax = await Fax.create({
      faxId: "fax_retry_1",
      tenantId: "tenant1",
      fromNumber: "+18885554321",
      toNumber: "+18885551234",
      provider: "Sinch",
      status: "failed",
      retries: 0
    });

    const res = await request(app).post(`/fax/retry/${fax.faxId}`);

    expect(res.status).toBe(202);
    expect(res.body.retries).toBe(1);

    const updated = await Fax.findOne({ faxId: fax.faxId });
    expect(updated.retries).toBe(1);
    expect(updated.status).toBe("processing");
  });
});
