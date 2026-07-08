const healthService = require("../services/healthService");

module.exports = {
  async getHealth(req, res) {
    try {
      const data = await healthService.getSystemHealth();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
};
