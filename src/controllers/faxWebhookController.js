// src/controllers/faxWebhookController.js
exports.handleFaxWebhook = async (req, res, next) => {
  try {
    const correlationId = req.correlationId;

    const { id, status, direction, metadata } = req.body || {};

    if (!id || !status) {
      return next({
        status: 400,
        message: "Invalid webhook payload: 'id' and 'status' are required",
        details: req.body,
        correlationId
      });
    }

    const event = {
      faxId: id,
      status,
      direction: direction || 'unknown',
      metadata: metadata || {},
      receivedAt: new Date().toISOString(),
      correlationId
    };

    // OPTIONAL: Idempotency (Redis/Postgres recommended)
    // if (await hasProcessedWebhook(id)) {
    //   return res.status(200).json({ success: true, correlationId });
    // }

    // OPTIONAL: Persist event (audit log)
    // await appendFaxEvent(event);

    return res.status(200).json({
      success: true,
      message: "Webhook received",
      event,
      correlationId
    });

  } catch (error) {
    next({
      status: error.status || 500,
      message: error.message || "Webhook processing failed",
      details: error.details || null,
      correlationId: req.correlationId
    });
  }
};
