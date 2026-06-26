const request = require("supertest");
const app = require("../server");
const Fax = require("../src/models/Fax");
const WebhookEvent = require("../src/models/WebhookEvent");
const crypto = require("crypto");

const SECRET = process.env.WEBHOOK_SECRET_2026_05 || "dev-webhook-secret";

function sign(ts, raw) {
  const signed = Buffer.concat([Buffer.from(`${ts}.`), raw]);
  const digest = crypto.createHmac("sha256", SECRET).update(signed).digest("hex");
  return `sha256=${digest}`;
}

describe("Full Integration Tests", () => {
  beforeEach(async () => {
    await Fax.deleteMany({});
    await WebhookEvent.deleteMany({});
  });

  test("Fax send → webhook delivered → dashboard list", async () => {
    // Step 1: Send fax
    const sendRes = await request(app)
      .post("/fax/send")
      .send({
        toNumber: "+18885550002",
        fromNumber: "+18885550001",
        tenantId: "tenant1",
        provider: "Sinch"
      });

    const faxId = sendRes.body.faxId;
    expect(faxId).toBeDefined();

    // Step 2: Webhook delivered
    const payload = {
      id: "evt-delivered",
      type: "fax.delivered",
      data: {
        faxId,
        provider: "Sinch",
        status: "delivered"
      }
    };

    const raw = Buffer.from(JSON.stringify(payload));
    const ts = Date.now().toString();
    const sig = sign(ts, raw);

    const webhookRes = await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", sig)
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(raw);

    expect(webhookRes.status).toBe(200);

    // Step 3: Dashboard list
    const listRes = await request(app).get("/fax/list");
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].status).toBe("delivered");
  });
});
