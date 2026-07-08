const GlobalConfig = require("../models/GlobalConfig");
const auditService = require("./auditService");

module.exports = {
  async getConfig() {
    let config = await GlobalConfig.findOne();
    if (!config) {
      config = await GlobalConfig.create({});
    }
    return config;
  },

  async updateConfig(updates, adminId) {
    const config = await this.getConfig();

    Object.assign(config, updates);
    await config.save();

    await auditService.logEvent({
      type: "GLOBAL_CONFIG_UPDATED",
      details: { adminId, updates }
    });

    return config;
  }
};
