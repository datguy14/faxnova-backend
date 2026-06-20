const express = require("express");
const auth = require("../middleware/auth.js");

const { providerHealthController } = require("../controllers/providerHealth.controller.js");
const { providerBillingController } = require("../controllers/providerBilling.controller.js");

const { inboundFaxDashboardController } = require("../controllers/inboundFaxDashboard.controller.js");
const { outboundFaxDashboardController } = require("../controllers/outboundFaxDashboard.controller.js");

const router = express.Router();

/**
 * -----------------------------------------------------
 * PROVIDER HEALTH ANALYTICS
 * -----------------------------------------------------
 */

router.get(
  "/providers/status",
  auth,
  providerHealthController.getStatus
);

router.get(
  "/providers/performance",
  auth,
  providerHealthController.getPerformance
);

router.get(
  "/providers/outages",
  auth,
  providerHealthController.getOutages
);

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

router.get(
  "/providers/billing/summary",
  auth,
  providerBillingController.getBillingSummary
);

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

router.get(
  "/inbound",
  auth,
  inboundFaxDashboardController.list
);

router.get(
  "/inbound/summary",
  auth,
  inboundFaxDashboardController.summary
);

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

router.get(
  "/outbound",
  auth,
  outboundFaxDashboardController.list
);

router.get(
  "/outbound/summary",
  auth,
  outboundFaxDashboardController.summary
);

router.get(
  "/outbound/volume",
  auth,
  outboundFaxDashboardController.volume
);

module.exports = router;
