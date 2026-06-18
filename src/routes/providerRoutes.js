// src/routes/providerRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import { providerLimiter } from "../middleware/rateLimit.js";

import {
  getAllProviders,
  getProviderBilling
} from "../controllers/provider.controller.js";

import { providerHealthController } from "../controllers/providerHealth.controller.js";
import { providerBillingController } from "../controllers/providerBilling.controller.js";

const router = express.Router();

/**
 * -----------------------------------------------------
 * PROVIDER METADATA (STATIC)
 * -----------------------------------------------------
 */

/**
 * GET /providers
 * Returns all providers + static routing metadata.
 */
router.get("/", auth, providerLimiter, getAllProviders);

/**
 * GET /providers/billing
 * Legacy static billing metadata (still supported).
 */
router.get("/billing", auth, providerLimiter, getProviderBilling);

/**
 * -----------------------------------------------------
 * PROVIDER HEALTH (REAL‑TIME)
 * -----------------------------------------------------
 */

/**
 * GET /providers/status
 * Real-time provider health + routing availability.
 */
router.get(
  "/status",
  auth,
  providerLimiter,
  providerHealthController.getStatus
);

/**
 * GET /providers/performance
 * Provider latency, success rate, failure rate.
 */
router.get(
  "/performance",
  auth,
  providerLimiter,
  providerHealthController.getPerformance
);

/**
 * GET /providers/outages
 * Active + historical outage data.
 */
router.get(
  "/outages",
  auth,
  providerLimiter,
  providerHealthController.getOutages
);

/**
 * POST /providers/outages/clear
 * Clears outage state for a provider.
 */
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

/**
 * POST /providers/billing/calculate
 * Calculate cost for a single fax.
 */
router.post(
  "/billing/calculate",
  auth,
  providerLimiter,
  providerBillingController.calculateFaxCost
);

/**
 * GET /providers/billing/summary?tier=pro
 * Returns billing summary for all providers.
 */
router.get(
  "/billing/summary",
  auth,
  providerLimiter,
  providerBillingController.getBillingSummary
);

export default router;
