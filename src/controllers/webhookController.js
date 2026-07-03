/**
 * src/controllers/webhookController.js
 *
 * Webhook ingestion controller with:
 * - HMAC SHA-256 signature verification (timing-safe)
 * - Idempotency via externalEventId uniqueness
 * - Strict input validation
 * - Batch queuing to webhookWorker
 * - Structured error responses
 */

const crypto = require("crypto");
const WebhookEvent = require("../models/WebhookEvent");
const webhookQueue = require("../queues/webhookQueue");
const FaxNovaError = require("../errors/FaxNovaError");

// Constants
const SIGNATURE_HEADER = "x-provider-signature";
const SIGNATURE_ALGORITHM = "sha256";

/**
 * Verify webhook signature using HMAC SHA-256 with timing-safe comparison
 *
 * @param {object} payload - Webhook payload
 * @param {string} signature - Signature from headers (hex format)
 * @param {string} secret - Shared secret for verification
 * @returns {boolean} - True if signature is valid
 * @throws {FaxNovaError} - If secret is missing
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) {
    throw new FaxNovaError("Webhook secret not configured", {
      code: "WEBHOOK_SECRET_MISSING"
    });
  }

  if (!signature) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac(SIGNATURE_ALGORITHM, secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch (err) {
    console.error("[webhookController] Signature verification error:", err);
    return false;
  }
}

/**
 * Validate required webhook event fields
 *
 * @param {object} evt - Event object
 * @throws {FaxNovaError} - If required fields missing
 */
function validateWebhookEvent(evt) {
  const required = ["eventId", "provider", "faxId", "status"];

  for (const field of required) {
    if (!evt[field]) {
      throw new FaxNovaError(`Missing required field: ${field}`, {
        code: "INVALID_WEBHOOK_EVENT",
        details: { field }
      });
    }
  }

  // Validate provider name
  if (!["sinch", "telnyx"].includes(evt.provider)) {
    throw new FaxNovaError(`Unknown provider: ${evt.provider}`, {
      code: "INVALID_PROVIDER"
    });
  }

  // Validate status is one of expected values
  const validStatuses = ["delivered", "failed", "queued", "sending"];
  if (!validStatuses.includes(evt.status)) {
    throw new FaxNovaError(`Invalid status: ${evt.status}`, {
      code: "INVALID_STATUS"
    });
  }
}

/**
 * Handle incoming webhook from provider
 *
 * Workflow:
 * 1. Extract and verify HMAC SHA-256 signature
 * 2. Validate required event fields
 * 3. Check idempotency via externalEventId
 * 4. Queue event batch for webhookWorker
 * 5. Return structured response
 *
 * @param {object} req - Express request
 * @param {object} req.body - Webhook payload
 * @param {string} req.headers['x-provider-signature'] - HMAC signature
 * @param {object} res - Express response
 * @returns {Promise<void>}
 */
async function handleWebhook(req, res) {
  try {
    // Verify HMAC signature
    const signature = req.headers[SIGNATURE_HEADER];
    const secret = process.env.PROVIDER_WEBHOOK_SECRET;

    if (!verifyWebhookSignature(req.body, signature, secret)) {
      console.warn("[webhookController] Signature verification failed");
      return res.status(401).json({
        success: false,
        error: "Invalid signature",
        code: "SIGNATURE_INVALID"
      });
    }

    // Extract and validate event
    const evt = {
      eventId: req.body.eventId,
      provider: req.body.provider,
      faxId: req.body.faxId,
      status: req.body.status,
      providerStatus: req.body.providerStatus || null,
      errorCode: req.body.errorCode || null,
      errorMessage: req.body.errorMessage || null,
      raw: req.body
    };

    // Validate required fields
    validateWebhookEvent(evt);

    // Idempotency check: has this event been processed?
    const exists = await WebhookEvent.findOne({ externalEventId: evt.eventId });
    if (exists) {
      console.info(`[webhookController] Duplicate event: ${evt.eventId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Event already processed"
      });
    }

    // Queue event batch for worker processing
    await webhookQueue.add({
      events: [evt]
    });

    return res.status(202).json({
      success: true,
      message: "Webhook queued for processing",
      eventId: evt.eventId
    });

  } catch (err) {
    console.error("[webhookController] Error processing webhook:", err);

    if (err instanceof FaxNovaError) {
      return res.status(400).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "WEBHOOK_PROCESSING_ERROR"
    });
  }
}

module.exports = { handleWebhook };
