// src/controllers/faxController.js
// Strict‑Mode FaxNova Fax Controller

const { routeFax } = require("../routing/routeFax");
const { getFaxStatus } = require("../services/faxStatusService");
const { isOutage } = require("../services/providerOutageService");
const { enqueueOutboundFax } = require("../queues/outboundFaxQueue");

/**
 * Send Fax (Strict‑Mode)
 * Body:
 * {
 *   to: string,
 *   from: string,
 *   fileUrl: string,
 *   metadata?: object
 * }
 */
exports.sendFax = async (req, res) => {
  try {
    const { to, from, fileUrl, metadata = {} } = req.body;
    const user = req.user;

    if (!to || !from || !fileUrl) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: to, from, fileUrl"
      });
    }

    // Routing engine selects provider
    const provider = await routeFax({ to, from, user });

    if (!provider) {
      return res.status(503).json({
        ok: false,
        error: "No available provider"
      });
    }

    // Outage check
    if (await isOutage(provider.name)) {
      return res.status(503).json({
        ok: false,
        error: `Provider ${provider.name} is currently in outage`
      });
    }

    // Enqueue outbound fax
    const job = await enqueueOutboundFax({
      to,
      from,
      fileUrl,
      metadata,
      userId: user.id,
      provider: provider.name
    });

    return res.json({
      ok: true,
      faxId: job.faxId,
      provider: provider.name,
      queued: true
    });
  } catch (err) {
    console.error("❌ sendFax error:", err);

    return res.status(500).json({
      ok: false,
      error: "Internal fax send error"
    });
  }
};

/**
 * Get Fax Status (Strict‑Mode)
 */
exports.getStatus = async (req, res) => {
  try {
    const { faxId } = req.params;

    if (!faxId) {
      return res.status(400).json({
        ok: false,
        error: "Missing faxId"
      });
    }

    const status = await getFaxStatus(faxId);

    return res.json({
      ok: true,
      ...status
    });
  } catch (err) {
    console.error("❌ getStatus error:", err);

    return res.status(500).json({
      ok: false,
      error: "Internal fax status error"
    });
  }
};
