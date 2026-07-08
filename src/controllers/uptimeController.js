const uptimeService = require("../services/uptimeService");

module.exports = {
  async getUptime(req, res) {
    try {
      const data = await uptimeService.getUptimeMetrics();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
