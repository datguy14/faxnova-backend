// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");
const residencyGuard = require("../middleware/residencyGuard");

// POST /fax/send
// Validates input via Zod in controller
router.post(
  "/send",
  residencyGuard(), // Residency-aware if needed later
  faxController.sendFax
);

// GET /fax/:id
router.get(
  "/:id",
  residencyGuard(),
  faxController.getFaxById
);

// POST /fax/:id/retry
router.post(
  "/:id/retry",
  residencyGuard(),
  faxController.retryFax
);

module.exports = router;
