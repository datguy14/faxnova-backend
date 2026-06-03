const { z } = require("zod");
const Fax = require("../models/Fax");
const sendFaxService = require("../services/sendFaxService");
const logger = require("../utils/logger");

// =========================
// Zod Schema
// =========================
const faxSchema = z.object({
  to: z.string().min(10, "Recipient fax number is required"),
  from: z.string().optional(),
  fileUrl: z.string().url("A valid file URL is required"),
  provider: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase()), // FIXED: replaces .toLowerCase()
});

// =========================
// Send Fax Controller
// =========================
exports.sendFax = async (req, res) => {
  try {
    const parsed = faxSchema.parse(req.body);

    const provider =
      parsed.provider || process.env.DEFAULT_FAX_PROVIDER || "sinch";

    logger.info(`Sending fax using provider: ${provider}`);

    const faxRecord = await Fax.create({
      to: parsed.to,
      from: parsed.from,
      fileUrl: parsed.fileUrl,
      provider,
      status: "queued",
    });

    const result = await sendFaxService(provider, faxRecord);

    return res.status(200).json({
      message: "Fax queued successfully",
      faxId: faxRecord._id,
      provider,
      result,
    });
  } catch (err) {
    logger.error("Error sending fax:", err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to send fax",
      details: err.message,
    });
  }
};

// =========================
// Get Fax Status
// =========================
exports.getFaxStatus = async (req, res) => {
  try {
    const fax = await Fax.findById(req.params.id);

    if (!fax) {
      return res.status(404).json({ error: "Fax not found" });
    }

    return res.json({
      id: fax._id,
      status: fax.status,
      provider: fax.provider,
      createdAt: fax.createdAt,
    });
  } catch (err) {
    logger.error("Error fetching fax status:", err);
    return res.status(500).json({ error: "Failed to fetch fax status" });
  }
};
