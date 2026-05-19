// src/controllers/webhookController.js

const Fax = require('../models/Fax');
const WebhookEvent = require('../models/WebhookEvent');

exports.handleFaxWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const providerFaxId = payload.id;
    const status = payload.status;

    // Store webhook event
    const event = await WebhookEvent.create({
      tenantId: null, // or derive from fax record
      faxId: null,
      providerFaxId,
      status,
      rawPayload: payload,
      processingStatus: 'pending'
    });

    // Update fax status
    const fax = await Fax.findOneAndUpdate(
      { providerFaxId },
      {
        status,
        errorCode: payload.errorCode || null,
        errorMessage: payload.errorMessage || null,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Link event to fax if found
    if (fax) {
      event.faxId = fax._id;
      event.tenantId = fax.tenantId;
      event.processingStatus = 'processed';
      await event.save();
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ success: false });
  }
};
