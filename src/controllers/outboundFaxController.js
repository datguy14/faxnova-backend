// src/controllers/outboundFaxController.js — Unified Fax Architecture (CommonJS Only)

const outboundFaxService = require("../services/outboundFaxService");
const OutboundFax = require("../models/OutboundFax");

module.exports = {
  async sendFax(req, res) {
    try {
      const tenantId = req.tenantId; // from apiKeyGuard
      const {
        to,
        storageKey,
        residencyZone,
        tier,
        region,
        providerOverride,
        idempotencyKey
      } = req.body;

      const result = await outboundFaxService.processOutboundFax({
        to,
        storageKey,
        residencyZone,
        tier,
        region,
        providerOverride,
        tenantId,
        idempotencyKey
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getFaxStatus(req, res) {
    try {
      const { faxId } = req.params;
      const fax = await OutboundFax.findById(faxId);
      if (!fax) return res.status(404).json({ error: "Fax not found" });

      res.json({
        _id: fax._id,
        status: fax.status,
        provider: fax.provider,
        providerFaxId: fax.providerFaxId,
        region: fax.region
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async retryFax(req, res) {
    // optional: can hook into retryFaxService if you want manual retries
    res.status(501).json({ error: "Retry not implemented yet" });
  }
};
