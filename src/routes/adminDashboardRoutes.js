// src/routes/adminDashboardRoutes.js

const express = require("express");
const router = express.Router();

const OutboundFax = require("../models/OutboundFax");
const DeadLetterFax = require("../models/DeadLetterFax");
const WebhookEvent = require("../models/WebhookEvent");

// 1. Global system summary
router.get("/summary", async (req, res) => {
  try {
    const total = await OutboundFax.countDocuments({});
    const delivered = await OutboundFax.countDocuments({ status: "delivered" });
    const failed = await OutboundFax.countDocuments({ status: "failed" });
    const retrying = await OutboundFax.countDocuments({ status: "retrying" });
    const dead = await DeadLetterFax.countDocuments({});

    return res.json({
      success: true,
      summary: {
        total,
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

// 2. Provider performance analytics
router.get("/providers", async (req, res) => {
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

// 3. Sovereignty routing analytics
router.get("/sovereignty", async (req, res) => {
  try {
    const us = await OutboundFax.countDocuments({ region: "us" });
    const eu = await OutboundFax.countDocuments({ region: "eu" });
    const global = await OutboundFax.countDocuments({ region: "global" });

    return res.json({
      success: true,
      sovereignty: {
        us,
        eu,
        global
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Dead Letter Queue inspection
router.get("/dlq", async (req, res) => {
  try {
    const dead = await DeadLetterFax.find({}).sort({ createdAt: -1 });

    return res.json({
      success: true,
      deadLetterQueue: dead
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Retry pipeline analytics
router.get("/retry", async (req, res) => {
  try {
    const retrying = await OutboundFax.find({ status: "retrying" }).sort({
      updatedAt: -1
    });

    return res.json({
      success: true,
      retrying
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Fax timeline (webhook events)
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
