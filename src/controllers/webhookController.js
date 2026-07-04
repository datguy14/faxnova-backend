// src/controllers/webhookController.js

const Fax = require("../models/Fax");
const FaxEvent = require("../models/FaxEvent");

const idempotencyGuard = require("../guards/idempotencyGuard");
const auditService = require("../services/auditService");

exports.providerCallback = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { providerMessageId, status, provider } = req.body;

    // Idempotency check
    const idempotent = await idempotencyGuard.check({
      tenantId,
      key: `callback:${providerMessageId}:${status}`
    });

    if (!idempotent.ok) {
      return res.status(409).json({
        success: false,
        error: "Duplicate provider callback"
      });
    }

    // Find fax by provider message ID
    const fax = await Fax.findOne({
      tenantId,
      providerMessageId
    });

    if (!fax) {
      return res.status(404).json({
        success: false,
        error: "Fax not found for provider callback"
      });
    }

    // Update fax status
    fax.status = status;
    await fax.save();

    // Log event
    await auditService.logEvent({
      tenantId,
      faxId: fax._id,
      type: "provider_callback",
      action: "status_update",
      details: {
        provider,
        providerMessageId,
        status
      }
    });

    return res.json({
      success: true,
      data: { faxId: fax._id, status }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.verifyWebhook = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Webhook verified"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
