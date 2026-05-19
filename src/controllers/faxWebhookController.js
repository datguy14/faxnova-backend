// src/controllers/webhookController.js

const Fax = require('../models/Fax');
const WebhookEvent = require('../models/WebhookEvent');

exports.handleFaxWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const providerFaxId = payload.id;
    const status = payload.status;
    const errorCode = payload.errorCode || null;
    const errorMessage = payload.errorMessage || null;

    // 1. Create webhook event (initially unlinked)
    const event = await WebhookEvent.create({
      tenantId: null,               // will be filled once fax is found
      faxId: null,                  // will be filled once fax is found
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
    } else {
      // Fax not found — mark event as failed
      event.processingStatus = 'failed';
      event.errorMessage = 'Fax not found for providerFaxId';
      await event.save();
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err.message);

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};
