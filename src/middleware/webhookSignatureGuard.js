// src/middleware/webhookSignatureGuard.js
const crypto = require('crypto');

/**
 * Webhook Signature Guard
 *
 * Verifies HMAC SHA-256 signatures on incoming webhooks.
 * Assumes:
 *  - Shared secret in process.env.WEBHOOK_SECRET
 *  - Signature header:  x-webhook-signature
 *  - Timestamp header:  x-webhook-timestamp
 *
 * Rejects:
 *  - Missing headers
 *  - Invalid signature
 *  - Replayed requests (older than ALLOWED_DRIFT_MS)
 */

const ALLOWED_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

function computeSignature(secret, timestamp, bodyBuffer) {
  // Canonical payload: `${timestamp}.${rawBody}`
  const payload = `${timestamp}.${bodyBuffer.toString('utf8')}`;
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

function webhookSignatureGuard(req, res, next) {
  try {
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
      console.error('[webhookSignatureGuard] Missing WEBHOOK_SECRET env var');
      return res.status(500).json({
        error: 'Webhook signature verification not configured',
      });
    }

    const signatureHeader = req.headers['x-webhook-signature'];
    const timestampHeader = req.headers['x-webhook-timestamp'];

    if (!signatureHeader || !timestampHeader) {
      return res.status(400).json({
        error: 'Missing webhook signature headers',
      });
    }

    const timestamp = Number(timestampHeader);
    if (Number.isNaN(timestamp)) {
      return res.status(400).json({
        error: 'Invalid webhook timestamp',
      });
    }

    const now = Date.now();
    const age = Math.abs(now - timestamp);

    if (age > ALLOWED_DRIFT_MS) {
      return res.status(400).json({
        error: 'Webhook timestamp outside allowed window',
      });
    }

    // Ensure we have the raw body; if you're using body-parser,
    // configure it to expose req.rawBody or similar.
    const rawBody =
      req.rawBody ||
      (typeof req.body === 'string'
        ? Buffer.from(req.body, 'utf8')
        : Buffer.from(JSON.stringify(req.body || {}), 'utf8'));

    const expectedSignature = computeSignature(secret, timestamp, rawBody);

    if (expectedSignature !== signatureHeader) {
      return res.status(401).json({
        error: 'Invalid webhook signature',
      });
    }

    // Signature verified
    return next();
  } catch (err) {
    console.error('[webhookSignatureGuard] Error verifying signature:', err);
    return res.status(500).json({
      error: 'Error verifying webhook signature',
    });
  }
}

module.exports = webhookSignatureGuard;
