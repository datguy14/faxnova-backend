// src/routes/fax.js
// FaxNova Fax Routes — Strict‑Mode Edition

const express = require("express");
const router = express.Router();

const { routeFax } = require("../routing/engine");
const { getFaxStatus } = require("../services/faxStatusService"); // optional
const validateSendFax = require("../validation/validateSendFax"); // strict‑mode validator

/**
 * POST /fax/send
 * Sends a fax using the routing engine (Telnyx + Sinch)
 */
router.post("/send", async (req, res) => {
  try {
    // Strict‑mode validation
    const { to, from, mediaUrl, correlationId } = validateSendFax(req.body);

    const result = await routeFax({
      to,
      from,
      mediaUrl,
      correlationId
    });

    res.json({
      ok: true,
      provider: result.provider,
      result: result.result
    });
  } catch (err) {
    console.error("❌ Fax send error:", err);

    res.status(400).json({
      ok: false,
      error: err.message || "Failed to send fax"
    });
  }
});

/**
 * GET /fax/:id/status
 * Fetch fax status from the provider (Telnyx or Sinch)
 */
router.get("/:id/status", async (req, res) => {
  try {
    const faxId = req.params.id;

    const status = await getFaxStatus(faxId);

    res.json({
      ok: true,
      status
    });
  } catch (err) {
    console.error("❌ Fax status error:", err);

    res.status(400).json({
      ok: false,
      error: err.message || "Failed to fetch fax status"
    });
  }
});

module.exports = router;
