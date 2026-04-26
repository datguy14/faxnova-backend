const { v4: uuidv4 } = require('uuid');
const { logFaxEvent } = require('../utils/auditLogger');

function verifyWebhookSecret(req) {
  const expected = process.env.FAX_WEBHOOK_SECRET;

  // In production, always require the secret to be set
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        level: 'error',
        message: 'FAX_WEBHOOK_SECRET is not set in production — rejecting all webhook requests',
      }));
      return false;
    }
    // In development, allow through but warn loudly
    console.warn(JSON.stringify({
      level: 'warn',
      message: 'FAX_WEBHOOK_SECRET is not set — webhook auth is DISABLED (dev mode only)',
    }));
    return true;
  }

  const received = req.headers['x-faxnova-webhook-secret'];
  return received && received === expected;
}

async function handleFaxWebhook(req, res, next) {
  try {
    if (!verifyWebhookSecret(req)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing webhook secret',
      });
    }

    const correlationId =
      req.headers['x-correlation-id'] ||
      req.correlationId ||
      uuidv4();

    const {
      faxId,
      status,
      providerEvent,
      errorCode,
      errorMessage,
      metadata,
    } = req.body || {};

    if (!faxId || !status) {
      return res.status(400).json({
        success: false,
        error: 'faxId and status are required',
        correlationId,
      });
    }

    logFaxEvent({
      faxId,
      status,
      providerEvent: providerEvent || null,
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      metadata: metadata || null,
      correlationId,
      source: 'fax_webhook',
    });

    return res.status(200).json({
      success: true,
      correlationId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleFaxWebhook,
};
