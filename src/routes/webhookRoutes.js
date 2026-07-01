const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhookController");

// ---------------------------------------------------------
// Sinch Outbound Fax Webhook
// ---------------------------------------------------------
router.post("/sinch/outbound", async (req, res, next) => {
  try {
    await webhookController.handleSinchOutbound(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Telnyx Outbound Fax Webhook
// ---------------------------------------------------------
router.post("/telnyx/outbound", async (req, res, next) => {
  try {
    await webhookController.handleTelnyxOutbound(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Inbound Fax Webhook (Sinch or Telnyx)
// ---------------------------------------------------------
router.post("/inbound", async (req, res, next) => {
  try {
    await webhookController.handleInboundFax(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Provider Delivery Receipt (Unified Normalized Format)
// ---------------------------------------------------------
router.post("/delivery", async (req, res, next) => {
  try {
    await webhookController.handleDeliveryReceipt(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Provider Error / Failure Notification
// ---------------------------------------------------------
router.post("/error", async (req, res, next) => {
  try {
    await webhookController.handleProviderError(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
