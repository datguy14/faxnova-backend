const Heartbeat = require("../models/Heartbeat");

module.exports = {
  async recordHeartbeat(data) {
    await Heartbeat.create({
      timestamp: new Date(),
      ...data
    });
  },

  async getUptimeMetrics() {
    const last100 = await Heartbeat.find().sort({ timestamp: -1 }).limit(100);

    const uptimeCount = last100.filter(h => h.status === "ok").length;
    const degradedCount = last100.filter(h => h.status === "degraded").length;
    const downCount = last100.filter(h => h.status === "down").length;

    const uptimePercentage = uptimeCount / last100.length;

    return {
      uptimePercentage,
      last100,
      uptimeCount,
      degradedCount,
      downCount
    };
  }
};
