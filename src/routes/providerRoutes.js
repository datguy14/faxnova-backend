const express = require("express");
const router = express.Router();

const providerHealthService = require("../services/providerHealthService");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerRoutingEngine = require("../services/providerRoutingEngine");

// ---------------------------------------------------------
// Get all providers + scores + health
// ---------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const providers = providerRoutingEngine.getAllProviders();
    const enriched = providers.map((p) => ({
      provider: p,
      score: providerPerformanceService.getScore(p),
      health: providerHealthService.getHealth(p),
    }));

    res.json({ success: true, providers: enriched });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Get provider health
// ---------------------------------------------------------
router.get("/:provider/health", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const health = providerHealthService.getHealth(provider);

    res.json({ success: true, provider, health });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Manually update provider health
// ---------------------------------------------------------
router.post("/:provider/health", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { status } = req.body;

    const updated = providerHealthService.setHealth(provider, status);

    res.json({ success: true, provider, updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Get provider score
// ---------------------------------------------------------
router.get("/:provider/score", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const score = providerPerformanceService.getScore(provider);

    res.json({ success: true, provider, score });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Manually adjust provider score
// ---------------------------------------------------------
router.post("/:provider/score", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { score } = req.body;

    const updated = providerPerformanceService.setScore(provider, score);

    res.json({ success: true, provider, updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Apply success boost
// ---------------------------------------------------------
router.post("/:provider/boost", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const updated = await providerPerformanceService.applySuccessBoost(provider);

    res.json({ success: true, provider, updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Apply failure penalty
// ---------------------------------------------------------
router.post("/:provider/penalty", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const updated = await providerPerformanceService.applyFailurePenalty(provider);

    res.json({ success: true, provider, updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------
// Sovereignty Routing Preview
// ---------------------------------------------------------
router.get("/routing/next", async (req, res, next) => {
  try {
    const provider = await providerRoutingEngine.selectProvider();
    res.json({ success: true, nextProvider: provider });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
