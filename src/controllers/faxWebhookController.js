// src/controllers/webhookController.js

const Fax = require('../models/Fax');
const WebhookEvent = require('../models/WebhookEvent');
const audit = require('../audit/auditService');

exports.handleFaxWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const providerFaxId = payload.id;
    const status = payload.status;
    const errorCode = payload.errorCode || null;
    const errorMessage = payload.errorMessage || null;

    // -----------------------------
    // AUDIT: Webhook received
    // -----------------------------
    audit.logEvent({
      tenantId: null, // will be filled once fax is found
      type: 'webhook',
      action: 'webhook_received',
      correlationId: null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: { providerFaxId, status, payload }
    });

    // 1. Create webhook event (initially unlinked)
    const event = await WebhookEvent.create({
      tenantId: null,
      faxId: null,
      providerFaxId,
      status,
      rawPayload: payload,
      processingStatus: 'pending',
      errorMessage: null,
      receivedAt: new Date()
    });

    // 2. Update fax status
    const fax = await Fax.findOneAndUpdate(
      { providerFaxId },
      {
        status,
        errorCode,
        errorMessage,
        updatedAt: new Date()
      },
      { new: true }
    );

    // 3. Link webhook event to fax + tenant
    if (fax) {
      event.faxId = fax._id;
      event.tenantId = fax.tenantId;
      event.processingStatus = 'processed';
      await event.save();

      // -----------------------------
      // AUDIT: Fax status updated
      // -----------------------------
      audit.logEvent({
        tenantId: fax.tenantId,
        type: 'webhook',
        action: 'fax_status_updated',
        correlationId: fax.metadata?.correlationId || null,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: 'system',
        details: {
          faxId: fax._id,
          providerFaxId,
          newStatus: status
        }
      });

    } else {
      // Fax not found — mark event as failed
      event.processingStatus = 'failed';
      event.errorMessage = 'Fax not found for providerFaxId';
      await event.save();

      // -----------------------------
      // AUDIT: Fax not found
      // -----------------------------
      audit.logEvent({
        tenantId: null,
        type: 'webhook',
        action: 'fax_not_found',
        correlationId: null,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: 'system',
        details: { providerFaxId }
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err.message);

    // -----------------------------
    // AUDIT: Webhook processing failure
    // -----------------------------
    audit.logEvent({
      tenantId: null,
      type: 'webhook',
      action: 'webhook_processing_failed',
      correlationId: null,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: 'system',
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};
