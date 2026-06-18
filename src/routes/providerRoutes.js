// src/routes/providerRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import { providerLimiter } from "../middleware/rateLimit.js";

import {
  getAllProviders,
  getProviderStatus,
  getProviderPerformance,
  getProviderOutages,
  getProviderBilling
} from "../controllers/provider.controller.js";

import { providerHealthController } from "../controllers/providerHealth.controller.js";

const router = express.Router();

/**
 * GET /providers
 * Returns all providers + routing metadata.
 */
router.get("/", auth, providerLimiter, getAllProviders);

/**
 * GET /providers/status
 * Returns real-time provider health + routing availability.
 * (Upgraded to use providerHealthController)
 */
router.get("/status", auth, providerLimiter, providerHealthController.getStatus);

/**
 * GET /providers/performance
 * Returns provider performance scoring (latency, success rate, cost).
 */
router.get(
  "/performance",
  auth,
  providerLimiter,
  providerHealthController.getPerformance
);

/**
 * GET /providers/outages
 * Returns provider outage history + active incidents.
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
 * GET /providers/billing
 * Returns provider billing metrics (cost per page, per region, etc.).
 */
router.get("/billing", auth, providerLimiter, getProviderBilling);

export default router;
