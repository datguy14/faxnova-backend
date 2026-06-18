// src/routes/dashboardRoutes.js
import express from "express";
import auth from "../middleware/auth.js";

import { inboundFaxDashboardController } from "../controllers/inboundFaxDashboard.controller.js";
import { outboundFaxDashboardController } from "../controllers/outboundFaxDashboard.controller.js";

const router = express.Router();

/**
 * -----------------------------------------------------
 * INBOUND FAX DASHBOARD ROUTES
 * -----------------------------------------------------
 */

/**
 * GET /dashboard/inbound
 * Paginated + filtered inbound fax list.
 */
router.get(
  "/inbound",
  auth,
  inboundFaxDashboardController.list
);

/**
 * GET /dashboard/inbound/summary
 * Summary metrics for inbound faxes.
 */
router.get(
  "/inbound/summary",
  auth,
  inboundFaxDashboardController.summary
);

/**
 * GET /dashboard/inbound/volume
 * Volume-by-day chart data for inbound faxes.
 */
router.get(
  "/inbound/volume",
  auth,
  inboundFaxDashboardController.volume
);

/**
 * -----------------------------------------------------
 * OUTBOUND FAX DASHBOARD ROUTES
 * -----------------------------------------------------
 */

/**
 * GET /dashboard/outbound
 * Paginated + filtered outbound fax list.
 */
router.get(
  "/outbound",
  auth,
  outboundFaxDashboardController.list
);

/**
 * GET /dashboard/outbound/summary
 * Summary metrics for outbound faxes.
 */
router.get(
  "/outbound/summary",
  auth,
  outboundFaxDashboardController.summary
);

/**
 * GET /dashboard/outbound/volume
 * Volume-by-day chart data for outbound faxes.
 */
router.get(
  "/outbound/volume",
  auth,
  outboundFaxDashboardController.volume
);

export default router;
