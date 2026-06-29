// src/routes/webhookRoutes.js

const express = require("express");
const router = express.Router();

const OutboundFax = require("../models/OutboundFax");
const WebhookEvent = require("../models/WebhookEvent");

router.post("/provider/status", async (req, res) => {
  try {
    const { faxId, status, provider, raw } = req.body;

    // Store webhook event for audit + analytics
    await WebhookEvent.create({
      faxId,
      provider,
      payload: raw,
      eventType: "status",
      createdAt: new Date()
    });

    // Update OutboundFax (the ONLY fax model in FaxNova v1)
    await OutboundFax.updateOne(
      { faxId },
      {
        $set: {
          status,
          providerStatus: raw,
          updatedAt: new Date()
        }
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
