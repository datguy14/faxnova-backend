// src/routes/faxStatusRoutes.js

const express = require("express");
const router = express.Router();

const { updateFromProvider } = require("../services/faxStatusService");

// Provider-specific status adapters
const sinchStatusAdapter = require("../providers/sinchStatusAdapter");
const telnyxStatusAdapter = require("../providers/telnyxStatusAdapter");

/**
 * POST /fax/status/sinch
 * Sinch status webhook → normalized → faxStatusService
 */
router.post("/sinch", sinchStatusAdapter, async (req, res) => {
  try {
    const result = await updateFromProvider(req.body);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /fax/status/telnyx
 * Telnyx status webhook → normalized → faxStatusService
 */
router.post("/telnyx", telnyxStatusAdapter, async (req, res) => {
  try {
    const result = await updateFromProvider(req.body);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
