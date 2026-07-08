const providerMetricsService = require("../services/providerMetricsService");

module.exports = {
  async getMetrics(req, res) {
    try {
      const data = await providerMetricsService.getProviderMetrics();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
