const providerLatencyService = require("../services/providerLatencyService");

module.exports = {
  async getLatency(req, res) {
    try {
      const data = await providerLatencyService.getLatencyMetrics();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
