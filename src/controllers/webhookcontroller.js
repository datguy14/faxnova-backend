// src/controllers/webhookController.js

const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  // Prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8")
  );
}
