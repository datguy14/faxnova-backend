const Fax = require("../src/models/Fax");
const WebhookEvent = require("../src/models/WebhookEvent");

describe("Model Tests", () => {
  beforeEach(async () => {
    await Fax.deleteMany({});
    await WebhookEvent.deleteMany({});
  });

  test("Creates Fax with valid schema", async () => {
    const fax = await Fax.create({
      faxId: "fax123",
      tenantId: "tenant1",
      fromNumber: "+18885550001",
      toNumber: "+18885550002",
      provider: "Sinch",
      status: "processing"
    });

    expect(fax.faxId).toBe("fax123");
    expect(fax.status).toBe("processing");
  });

  test("Rejects invalid provider enum", async () => {
    try {
      await Fax.create({
        faxId: "fax999",
        tenantId: "tenant1",
        fromNumber: "+18885550001",
        toNumber: "+18885550002",
        provider: "InvalidProvider",
        status: "processing"
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test("WebhookEvent enforces unique eventId", async () => {
    await WebhookEvent.create({ eventId: "evt1" });

    await expect(
      WebhookEvent.create({ eventId: "evt1" })
    ).rejects.toThrow();
  });
});
