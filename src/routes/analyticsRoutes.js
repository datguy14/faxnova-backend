// src/routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();

const OutboundFax = require("../models/OutboundFax");
const WebhookEvent = require("../models/WebhookEvent");

// Total faxes for a tenant
router.get("/tenant/:tenantId/summary", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const total = await OutboundFax.countDocuments({ tenantId });
    const sent = await OutboundFax.countDocuments({ tenantId, status: "sent" });
    const delivered = await OutboundFax.countDocuments({ tenantId, status: "delivered" });
    const failed = await OutboundFax.countDocuments({ tenantId, status: "failed" });
    const retrying = await OutboundFax.countDocuments({ tenantId, status: "retrying" });
    const dead = await OutboundFax.countDocuments({ tenantId, status: "dead" });

    return res.json({
      success: true,
      summary: {
        total,
        sent,
        delivered,
        failed,
        retrying,
        dead
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Provider performance analytics
router.get("/providers/performance", async (req, res) => {
  try {
    const sinchSuccess = await OutboundFax.countDocuments({
      provider: "sinch",
      status: { $in: ["sent", "delivered"] }
    });

    const sinchFail = await OutboundFax.countDocuments({
      provider: "sinch",
      status: "failed"
    });

    const telnyxSuccess = await OutboundFax.countDocuments({
      provider: "telnyx",
      status: { $in: ["sent", "delivered"] }
    });

    const telnyxFail = await OutboundFax.countDocuments({
      provider: "telnyx",
      status: "failed"
    });

    return res.json({
      success: true,
      providers: {
        sinch: {
          success: sinchSuccess,
          failed: sinchFail
        },
        telnyx: {
          success: telnyxSuccess,
          failed: telnyxFail
        }
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Timeline analytics (based on webhook events)
router.get("/timeline/:faxId", async (req, res) => {
  try {
    const { faxId } = req.params;

    const events = await WebhookEvent.find({ faxId }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      faxId,
      timeline: events
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
