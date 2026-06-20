const express = require("express");
const auth = require("../middleware/auth.js");
const { providerLimiter } = require("../middleware/rateLimit.js");

const {
  getAllProviders,
  getProviderBilling
} = require("../controllers/provider.controller.js");

const { providerHealthController } = require("../controllers/providerHealth.controller.js");
const { providerBillingController } = require("../controllers/providerBilling.controller.js");

const router = express.Router();

/**
 * -----------------------------------------------------
 * PROVIDER METADATA (STATIC)
 * -----------------------------------------------------
 */

router.get("/", auth, providerLimiter, getAllProviders);

router.get("/billing", auth, providerLimiter, getProviderBilling);

/**
 * -----------------------------------------------------
 * PROVIDER HEALTH (REAL‑TIME)
 * -----------------------------------------------------
 */

router.get(
  "/status",
  auth,
  providerLimiter,
  providerHealthController.getStatus
);

router.get(
  "/performance",
  auth,
  providerLimiter,
  providerHealthController.getPerformance
);

router.get(
  "/outages",
  auth,
  providerLimiter,
  providerHealthController.getOutages
);

router.post(
  "/outages/clear",
  auth,
  providerLimiter,
  providerHealthController.clearOutage
);

/**
 * -----------------------------------------------------
 * PROVIDER BILLING (ADVANCED)
 * -----------------------------------------------------
 */

router.post(
  "/billing/calculate",
  auth,
  providerLimiter,
  providerBillingController.calculateFaxCost
);

router.get(
  "/billing/summary",
  auth,
  providerLimiter,
  providerBillingController.getBillingSummary
);

module.exports = router;
