const express = require("express");
const auth = require("../middleware/auth.js");

const { inboundFaxDashboardController } = require("../controllers/inboundFaxDashboard.controller.js");
const { outboundFaxDashboardController } = require("../controllers/outboundFaxDashboard.controller.js");

const router = express.Router();

/**
 * -----------------------------------------------------
 * INBOUND FAX DASHBOARD ROUTES
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
 * OUTBOUND FAX DASHBOARD ROUTES
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
