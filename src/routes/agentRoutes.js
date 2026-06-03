const express = require("express");
const router = express.Router();

const agentAuth = require("../middleware/agentAuth");
const Fax = require("../models/Fax");
const FaxLog = require("../models/FaxLog");

// Protect all agent routes
router.use(agentAuth);

/* ================================================================
   GET ALL LOGS FOR THIS AGENT
================================================================ */
router.get("/logs", async (req, res) => {
  try {
    const logs = await FaxLog.find({ agentId: req.agent.id })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch logs",
      details: err.message
    });
  }
});

/* ================================================================
   GET ALL FAXES FOR THIS AGENT
================================================================ */
router.get("/faxes", async (req, res) => {
  try {
    const faxes = await Fax.find({ agentId: req.agent.id })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ faxes });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch faxes",
      details: err.message
    });
  }
});

/* ================================================================
   LOG A CUSTOM EVENT
================================================================ */
router.post("/log", async (req, res) => {
  try {
    const { faxId, action, message, metadata } = req.body;

    const log = await FaxLog.create({
      faxId,
      agentId: req.agent.id,
      action,
      message,
      metadata
    });

    return res.json({ message: "Log entry created", log });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to create log entry",
      details: err.message
    });
  }
});

module.exports = router;
