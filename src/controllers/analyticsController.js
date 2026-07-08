const analyticsService = require("../services/analyticsService");

module.exports = {
  async systemOverview(req, res) {
    try {
      const data = await analyticsService.getSystemOverview();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async tenantOverview(req, res) {
    try {
      const { tenantId } = req.params;
      const data = await analyticsService.getTenantOverview(tenantId);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
