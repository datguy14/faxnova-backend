// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();
const faxQueue = require("../queue/faxQueue");

router.post("/send", async (req, res) => {
  try {
    const { tenantId, to, from, pages, documentUrl, tier } = req.body;

    const job = await faxQueue.add("sendFax", {
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier
    });

    return res.json({
      success: true,
      queued: true,
      jobId: job.id
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
