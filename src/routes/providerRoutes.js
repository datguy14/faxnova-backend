// src/routes/providerRoutes.js

const express = require("express");
const router = express.Router();

const providerController = require("../controllers/provider.controller");
const providerHealthController = require("../controllers/providerHealthController");

const auth = require("../middleware/auth");
const residencyGuard = require("../middleware/residencyGuard");
const { providerLimiter } = require("../middleware/rateLimit");

// -----------------------------
// Provider Dashboard (Admin)
// -----------------------------
router.get(
  "/",
  auth,
  providerLimiter,
  residencyGuard(),
  providerController.getAllProviders
);

router.get(
  "/status",
  auth,
  providerLimiter,
  residencyGuard(),
  providerController.getProviderStatus
);

router.get(
  "/performance",
  auth,
  providerLimiter,
  residencyGuard(),
  providerController.getProviderPerformance
);

router.get(
  "/outages",
  auth,
  providerLimiter,
  residencyGuard(),
  providerController.getProviderOutages
);

router.get(
  "/billing",
  auth,
  providerLimiter,
  residencyGuard(),
  providerController.getProviderBilling
);

// -----------------------------
// Provider Health (System)
// -----------------------------
router.get(
  "/health/status",
  auth,
  providerLimiter,
  residencyGuard(),
  providerHealthController.getStatus
);

router.get(
  "/health/outages",
  auth,
  providerLimiter,
  residencyGuard(),
  providerHealthController.getOutages
);

router.get(
  "/health/performance",
  auth,
  providerLimiter,
  residencyGuard(),
  providerHealthController.getPerformance
);

router.post(
  "/health/outages/clear",
  auth,
  providerLimiter,
  residencyGuard(),
  providerHealthController.clearOutage
);

module.exports = router;
