const express = require("express");
const crypto = require("crypto");
const Fax = require("../models/Fax.js");
const WebhookEvent = require("../models/WebhookEvent.js");

const router = express.Router();

// RAW BODY ONLY FOR WEBHOOKS
router.use(express.raw({ type: "*/*", limit: "1mb" }));

const WEBHOOK_MAX_AGE_SECONDS = 300;
const WEBHOOK_SECRETS = {
  "whsec_2026_05": process.env.WEBHOOK_SECRET_2026_05
};

function timingSafeEqual(a, b) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function verifyWebhookSignature(rawBody, headers) {
  const sig = headers["x-webhook-signature"];
  const ts = headers["x-webhook-timestamp"];
  const keyId = headers["x-webhook-key-id"];

  if (!sig || !ts || !keyId) return false;

  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > WEBHOOK_MAX_AGE_SECONDS) return false;

  const secret = WEBHOOK_SECRETS[keyId];
  if (!secret) return false;

  const [algo, received] = sig.split("=", 2);
  if (algo !== "sha256") return false;

  const signed = Buffer.concat([Buffer.from(`${ts}.`), rawBody]);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed)
    .digest("hex");

  return timingSafeEqual(received, expected);
}

async function isReplay(eventId) {
  const exists = await WebhookEvent.findOne({ eventId });
  if (exists) return true;
  await WebhookEvent.create({ eventId });
  return false;
}

router.post("/provider", async (req, res) => {
  const rawBody = req.body;

  const headers = {
    "x-webhook-signature": req.header("x-webhook-signature"),
    "x-webhook-timestamp": req.header("x-webhook-timestamp"),
    "x-webhook-key-id": req.header("x-webhook-key-id")
  };

  if (!verifyWebhookSignature(rawBody, headers)) {
    return res.status(401).send("Invalid signature");
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  if (!event.id || !event.type || !event.data) {
    return res.status(400).send("Invalid event shape");
  }

  if (await isReplay(event.id)) {
    return res.status(200).send("duplicate");
  }

  const d = event.data;

  if (!d.faxId || !d.provider || !d.status) {
    return res.status(400).send("Invalid event data");
  }

  await Fax.updateOne(
    { faxId: d.faxId },
    {
      $set: {
        tenantId: d.tenantId,
        fromNumber: d.fromNumber,
        toNumber: d.toNumber,
        provider: d.provider,
        status: d.status,
        retries: d.retries ?? 0,
        rawProviderPayload: d.rawProviderPayload || {},
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  res.status(200).send("ok");
});

module.exports = router;
