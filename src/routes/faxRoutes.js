// src/routes/faxRoutes.js
import express from "express";
import { sendFax, getFaxStatus, retryFax } from "../controllers/fax.controller.js";
import auth from "../middleware/auth.js";
import { faxLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

/**
 * POST /fax/send
 * Send a fax using provider routing + residency + failover logic.
 */
router.post("/send", auth, faxLimiter, sendFax);

/**
 * GET /fax/:id
 * Retrieve fax status (queued, sending, sent, failed).
 */
router.get("/:id", auth, getFaxStatus);

/**
 * POST /fax/:id/retry
 * Retry a failed fax using provider failover logic.
 */
router.post("/:id/retry", auth, faxLimiter, retryFax);

export default router;
