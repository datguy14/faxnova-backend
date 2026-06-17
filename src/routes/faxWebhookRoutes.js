// src/routes/faxWebhookRoutes.js
import express from "express";
import {
  handleProviderStatusWebhook,
  handleInboundFaxWebhook
} from "../controllers/webhook.controller.js";

const router = express.Router();

/**
 * POST /webhook/provider-status
 * Provider → FaxNova
 * Delivery receipts, status updates, failures, retries, etc.
 * Public endpoint (providers must reach it).
 */
router.post(
  "/provider-status",
  express.json({ limit: "5mb" }),
  handleProviderStatusWebhook
);

/**
 * POST /webhook/inbound
 * Provider → FaxNova
 * Inbound fax reception (PDF/TIFF URLs, metadata, caller ID).
 * Public endpoint (providers must reach it).
 */
router.post(
  "/inbound",
  express.json({ limit: "10mb" }),
  handleInboundFaxWebhook
);

export default router;
