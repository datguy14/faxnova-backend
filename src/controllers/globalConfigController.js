const globalConfigService = require("../services/globalConfigService");

module.exports = {
  async getConfig(req, res) {
    try {
      const config = await globalConfigService.getConfig();
      res.json({ ok: true, data: config });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateConfig(req, res) {
    try {
      const updates = req.body;
      const adminId = req.adminId;

      const config = await globalConfigService.updateConfig(updates, adminId);
      res.json({ ok: true, data: config });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
