// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");
const inboundFaxController = require("../controllers/inboundFaxController");

const auth = require("../middleware/auth");
const faxLimiter = require("../middleware/faxLimiter");
const residencyGuard = require("../middleware/residencyGuard");

// -----------------------------
// Outbound Fax Routes
// -----------------------------

// POST /fax/send
router.post(
  "/send",
  auth,               // tenant auth
  faxLimiter,         // rate limiting
  residencyGuard,     // residency + sovereignty enforcement
  faxController.sendFax
);

// GET /fax/:id
router.get(
  "/:id",
  auth,
  faxController.getFaxById
);

// GET /fax
router.get(
  "/",
  auth,
  faxController.listFaxes
);

// -----------------------------
// Inbound Fax Webhooks
// -----------------------------

// POST /fax/inbound/:provider
router.post(
  "/inbound/:provider",
  inboundFaxController.receiveInboundFax
);

module.exports = router;
