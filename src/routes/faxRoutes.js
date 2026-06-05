
import express from "express";
import { sendFax, getFaxStatus } from "../controllers/faxController.js";

const router = express.Router();

// POST /fax/send
router.post("/send", sendFax);

// GET /fax/:provider/:faxId/status
router.get("/:provider/:faxId/status", getFaxStatus);

export default router;
