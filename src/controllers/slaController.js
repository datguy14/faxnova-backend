const slaEnforcementService = require("../services/slaEnforcementService");

module.exports = {
  async getSlaStatus(req, res) {
    try {
      const data = await slaEnforcementService.evaluateProviders();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
