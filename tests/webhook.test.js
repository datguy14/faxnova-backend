const request = require("supertest");
const crypto = require("crypto");
const app = require("../server");
const WebhookEvent = require("../src/models/WebhookEvent");
const Fax = require("../src/models/Fax");

const SECRET = process.env.WEBHOOK_SECRET_2026_05 || "dev-webhook-secret";

function signPayload(timestamp, rawBody) {
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]);
  const digest = crypto.createHmac("sha256", SECRET).update(signed).digest("hex");
  return `sha256=${digest}`;
}

describe("Webhook Tests", () => {
  beforeEach(async () => {
    await WebhookEvent.deleteMany({});
    await Fax.deleteMany({});
  });

  test("Rejects invalid signature", async () => {
    const body = Buffer.from(JSON.stringify({ id: "evt1", type: "fax.delivered", data: {} }));

    const res = await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", "sha256=invalid")
      .set("x-webhook-timestamp", Date.now().toString())
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(body);

    expect(res.status).toBe(401);
  });

  test("Accepts valid signature", async () => {
    const payload = { id: "evt1", type: "fax.delivered", data: { faxId: "fax123", provider: "Sinch", status: "delivered" } };
    const raw = Buffer.from(JSON.stringify(payload));
    const ts = Date.now().toString();
    const sig = signPayload(ts, raw);

    const res = await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", sig)
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(raw);

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");

    const fax = await Fax.findOne({ faxId: "fax123" });
    expect(fax).not.toBeNull();
    expect(fax.status).toBe("delivered");
  });

  test("Rejects replayed event", async () => {
    const payload = { id: "evt1", type: "fax.delivered", data: { faxId: "fax123", provider: "Sinch", status: "delivered" } };
    const raw = Buffer.from(JSON.stringify(payload));
    const ts = Date.now().toString();
    const sig = signPayload(ts, raw);

    // First call
    await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", sig)
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(raw);

    // Replay
    const res = await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", sig)
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(raw);

    expect(res.status).toBe(200);
    expect(res.text).toBe("duplicate");
  });

  test("Rejects invalid event shape", async () => {
    const payload = { id: "evt1", type: "fax.delivered", data: {} };
    const raw = Buffer.from(JSON.stringify(payload));
    const ts = Date.now().toString();
    const sig = signPayload(ts, raw);

    const res = await request(app)
      .post("/webhooks/provider")
      .set("x-webhook-signature", sig)
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-key-id", "whsec_2026_05")
      .send(raw);

    expect(res.status).toBe(400);
  });
});
