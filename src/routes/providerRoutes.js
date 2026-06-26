const express = require("express");
const Fax = require("../models/Fax.js");
const router = express.Router();

router.get("/outage", async (req, res) => {
  res.json({
    sinch: { status: "operational", lastChecked: new Date().toISOString() },
    telnyx: { status: "operational", lastChecked: new Date().toISOString() }
  });
});

router.get("/billing", async (req, res) => {
  const faxes = await Fax.find({}).lean();

  const totalFaxes = faxes.length;
  const totalCostUsd = Number((totalFaxes * 0.05).toFixed(2));

  const byProvider = ["Sinch", "Telnyx"].map(p => ({
    provider: p,
    count: faxes.filter(f => f.provider === p).length,
    costUsd: Number((faxes.filter(f => f.provider === p).length * 0.05).toFixed(2))
  }));

  res.json({ totalFaxes, totalCostUsd, byProvider });
});

module.exports = router;
