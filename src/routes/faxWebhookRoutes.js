import express from "express";
import { handleFaxWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// POST /webhook/fax
router.post("/fax", handleFaxWebhook);

export default router;
