// src/routes/analyticsRoutes.js
import express from "express";
import auth from "../middleware/auth.js";

import { providerHealthController } from "../controllers/providerHealth.controller.js";
import { providerBillingController } from "../controllers/providerBilling.controller.js";

import { inboundFaxDashboardController } from "../controllers/inboundFaxDashboard.controller.js";
import { outboundFaxDashboardController } from "../controllers/outboundFaxDashboard.controller.js";

const router = express.Router();

/**
 * -----------------------------------------------------
 * PROVIDER HEALTH ANALYTICS
 * -----------------------------------------------------
 */

/**
 * GET /analytics/providers/status
 * Real-time provider health + routing availability.
 */
router.get(
  "/providers/status",
  auth,
  providerHealthController.getStatus
);

/**
 * GET /analytics/providers/performance
 * Provider latency, success rate, failure rate.
 */
router.get(
  "/providers/performance",
  auth,
  providerHealthController.getPerformance
);

/**
 * GET /analytics/providers/outages
 * Active + historical outage data.
 */
router.get(
  "/providers/outages",
  auth,
  providerHealthController.getOutages
);

/**
 * POST /analytics/providers/outages/clear
 * Clears outage state for a provider.
 */
router.post(
  "/providers/outages/clear",
  auth,
  providerHealthController.clearOutage
);

/**
 * -----------------------------------------------------
 * PROVIDER BILLING ANALYTICS
 * -----------------------------------------------------
 */

/**
 * GET /analytics/providers/billing/summary
 * Billing summary for all providers.
 */
router.get(
  "/providers/billing/summary",
  auth,
  providerBillingController.getBillingSummary
);

/**
 * POST /analytics/providers/billing/calculate
 * Calculate cost for a single fax.
 */
router.post(
  "/providers/billing/calculate",
  auth,
  providerBillingController.calculateFaxCost
);

/**
 * -----------------------------------------------------
 * INBOUND FAX ANALYTICS
 * -----------------------------------------------------
 */

/**
 * GET /analytics/inbound
 * Paginated + filtered inbound fax list.
 */
router.get(
  "/inbound",
  auth,
  inboundFaxDashboardController.list
);

/**
 * GET /analytics/inbound/summary
 * Summary metrics for inbound faxes.
 */
router.get(
  "/inbound/summary",
  auth,
  inboundFaxDashboardController.summary
);

/**
 * GET /analytics/inbound/volume
 * Volume-by-day chart data for inbound faxes.
 */
router.get(
  "/inbound/volume",
  auth,
  inboundFaxDashboardController.volume
);

/**
 * -----------------------------------------------------
 * OUTBOUND FAX ANALYTICS
 * -----------------------------------------------------
 */

/**
 * GET /analytics/outbound
 * Paginated + filtered outbound fax list.
 */
router.get(
  "/outbound",
  auth,
  outboundFaxDashboardController.list
);

/**
 * GET /analytics/outbound/summary
 * Summary metrics for outbound faxes.
 */
router.get(
  "/outbound/summary",
  auth,
  outboundFaxDashboardController.summary
);

/**
 * GET /analytics/outbound/volume
 * Volume-by-day chart data for outbound faxes.
 */
router.get(
  "/outbound/volume",
  auth,
  outboundFaxDashboardController.volume
);

export default router;
