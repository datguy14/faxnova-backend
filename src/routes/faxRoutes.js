// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");
const inboundFaxController = require("../controllers/inboundFaxController");

const auth = require("../middleware/auth");
const residencyGuard = require("../middleware/residencyGuard");
const { faxLimiter } = require("../middleware/rateLimit");

// -----------------------------
// Outbound Fax Routes
// -----------------------------

// POST /fax/send
router.post(
  "/send",
  auth,
  faxLimiter,
  residencyGuard(),
  faxController.sendFax
);

// GET /fax/:id
router.get(
  "/:id",
  auth,
  residencyGuard(),
  faxController.getFax
);

// GET /fax
router.get(
  "/",
  auth,
  residencyGuard(),
  faxController.listFaxes
);

// -----------------------------
// Inbound Fax Routes
// -----------------------------

// GET /fax/inbound
router.get(
  "/inbound",
  auth,
  residencyGuard(),
  faxController.listInbound
);

// POST /fax/inbound/:provider (webhooks)
router.post(
  "/inbound/:provider",
  inboundFaxController.receiveInboundFax
);

module.exports = router;
