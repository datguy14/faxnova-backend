const express = require("express");
const { z } = require("zod");
const Fax = require("../models/Fax.js");

const router = express.Router();

const faxSchema = z.object({
  faxId: z.string().optional(),
  toNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  fromNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  tenantId: z.string().min(1),
  provider: z.enum(["Sinch", "Telnyx"]),
  metadata: z.record(z.any()).optional()
});

router.get("/list", async (req, res) => {
  const faxes = await Fax.find({})
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  res.json(
    faxes.map(f => ({
      faxId: f.faxId,
      tenantId: f.tenantId,
      fromNumber: f.fromNumber,
      toNumber: f.toNumber,
      provider: f.provider,
      status: f.status,
      retries: f.retries,
      updatedAt: f.updatedAt
    }))
  );
});

router.get("/:id", async (req, res) => {
  const fax = await Fax.findOne({ faxId: req.params.id }).lean();
  if (!fax) return res.status(404).json({ error: "Fax not found" });
  res.json(fax);
});

router.post("/send", async (req, res) => {
  const parsed = faxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid fax payload" });
  }

  const data = parsed.data;
  const faxId = data.faxId || `fax_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const existing = await Fax.findOne({ faxId });
  if (existing) {
    return res.json({ status: existing.status, faxId });
  }

  await Fax.create({
    faxId,
    tenantId: data.tenantId,
    fromNumber: data.fromNumber,
    toNumber: data.toNumber,
    provider: data.provider,
    status: "processing",
    retries: 0
  });

  res.status(202).json({ status: "queued", faxId });
});

router.post("/retry/:id", async (req, res) => {
  const fax = await Fax.findOne({ faxId: req.params.id });
  if (!fax) return res.status(404).json({ error: "Fax not found" });

  if (fax.status === "processing") {
    return res.json({ status: "processing", faxId: fax.faxId });
  }

  fax.status = "processing";
  fax.retries += 1;
  await fax.save();

  res.status(202).json({ status: "queued", faxId: fax.faxId, retries: fax.retries });
});

module.exports = router;
