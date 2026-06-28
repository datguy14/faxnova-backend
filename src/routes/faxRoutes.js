// src/routes/faxRoutes.js

router.post("/send", async (req, res) => {
  try {
    const { tenantId, to, from, pages, documentUrl, tier, region } = req.body;

    const job = await faxQueue.add("sendFax", {
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier,
      region // "us" | "eu" | "global"
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
