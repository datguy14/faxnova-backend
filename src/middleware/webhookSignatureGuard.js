// src/middleware/webhookSignatureGuard.js
// Strict‑Mode Webhook Signature Verification (Telnyx + Sinch + Custom)

const crypto = require("crypto");

function verifyCustom(req) {
  const signature = req.headers["x-webhook-signature"];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret || !req.rawBody) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(computed, "utf8")
  );
}

function verifySinch(req) {
  const signature = req.headers["x-sinch-signature"];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret || !req.rawBody) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(computed, "utf8")
  );
}

function verifyTelnyx(req) {
  const signature = req.headers["telnyx-signature-ed25519"];
  const timestamp = req.headers["telnyx-timestamp"];
  const secret = process.env.TELNYX_WEBHOOK_SECRET;

  if (!signature || !timestamp || !secret || !req.rawBody) return false;

  // Telnyx requires Ed25519 verification using their SDK.
  // Until wired, fail closed.
  return false;
}

module.exports = (req, res, next) => {
  try {
    const path = req.path || "";

    let valid = false;

    if (path.includes("telnyx")) valid = verifyTelnyx(req);
    else if (path.includes("sinch")) valid = verifySinch(req);
    else valid = verifyCustom(req);

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: "Invalid webhook signature"
      });
    }

    next();
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);

    res.status(401).json({
      ok: false,
      error: "Webhook signature verification failed"
    });
  }
};
