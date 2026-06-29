const express = require("express");
const router = express.Router();

const { auth, requireAdmin } = require("../middleware/authMiddleware");
const providerHealthService = require("../services/providerHealthService");

// GET /providers/health — full dashboard health
router.get("/health", auth, requireAdmin, async (req, res) => {
  try {
    const health = await providerHealthService.getAllProvidersHealth();
    res.json({ providers: health });
  } catch (err) {
    console.error("PROVIDER HEALTH ROUTE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch provider health" });
  }
});

// GET /providers/:name/health — single provider health
router.get("/:name/health", auth, requireAdmin, async (req, res) => {
  try {
    const providerName = req.params.name;
    const health = await providerHealthService.getProviderHealth(providerName);
    res.json(health);
  } catch (err) {
    console.error("SINGLE PROVIDER HEALTH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch provider health" });
  }
});

module.exports = router;
