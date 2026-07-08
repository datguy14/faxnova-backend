const mongoose = require("mongoose");

const GlobalConfigSchema = new mongoose.Schema({
  providerDefaults: {
    primary: { type: String, default: "telnyx" },
    failover: { type: String, default: "sinch" }
  },

  sla: {
    successRateThreshold: { type: Number, default: 0.95 },
    latencyThresholdMs: { type: Number, default: 3000 },
    errorRateThreshold: { type: Number, default: 0.03 },
    evaluationWindow: { type: Number, default: 100 }
  },

  routing: {
    defaultRegion: { type: String, default: "us" }
  },

  features: {
    enableFailover: { type: Boolean, default: true },
    enableLatencyTracking: { type: Boolean, default: true },
    enableSlaEnforcement: { type: Boolean, default: true }
  },

  admin: {
    maintenanceMode: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model("GlobalConfig", GlobalConfigSchema);
