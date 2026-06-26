const request = require("supertest");
const app = require("../server");
const Fax = require("../src/models/Fax");

describe("Provider Routes Tests", () => {
  beforeEach(async () => {
    await Fax.deleteMany({});
  });

  test("GET /providers/outage returns operational status", async () => {
    const res = await request(app).get("/providers/outage");

    expect(res.status).toBe(200);
    expect(res.body.sinch.status).toBe("operational");
    expect(res.body.telnyx.status).toBe("operational");
  });

  test("GET /providers/billing returns correct totals", async () => {
    await Fax.create({
      faxId: "fax1",
      tenantId: "tenant1",
      fromNumber: "+18885550001",
      toNumber: "+18885550002",
      provider: "Sinch",
      status: "delivered"
    });

    await Fax.create({
      faxId: "fax2",
      tenantId: "tenant1",
      fromNumber: "+18885550003",
      toNumber: "+18885550004",
      provider: "Telnyx",
      status: "failed"
    });

    const res = await request(app).get("/providers/billing");

    expect(res.status).toBe(200);
    expect(res.body.totalFaxes).toBe(2);
    expect(res.body.totalCostUsd).toBe(0.10);
    expect(res.body.byProvider.length).toBe(2);
  });
});
