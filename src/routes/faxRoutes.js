// src/routes/faxRoutes.js
import express from "express";
import { sendFax, getFaxStatus, retryFax } from "../controllers/fax.controller.js";
import auth from "../middleware/auth.js";
import { faxLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// All fax routes require authentication + rate limiting
router.post("/send", auth, faxLimiter, sendFax);
router.get("/:id", auth, getFaxStatus);
router.post("/:id/retry", auth, faxLimiter, retryFax);

export default router;
