// src/middleware/webhookSignatureGuard.js
// Strict‑Mode Webhook Signature Verification

const crypto = require("crypto");

module.exports = (req, res, next) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const secret = process.env.WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(401).json({
        ok: false,
        error: "Missing webhook signature"
      });
    }

    const computed = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (computed !== signature) {
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
}
