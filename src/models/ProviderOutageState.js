const mongoose = require("mongoose");

const ProviderOutageStateSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      index: true
    },

    region: {
      type: String,
      index: true
    },

    outageState: {
      type: String,
      enum: ["healthy", "degraded", "half_open", "open", "probation"],
      required: true,
      index: true
    },

    failures: {
      type: Number,
      default: 0
    },

    lastFailureAt: {
      type: Date
    },

    openedAt: {
      type: Date
    },

    cooldownUntil: {
      type: Date
    },

    probationUntil: {
      type: Date
    },

    details: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

// Indexes for routing + diagnostics
ProviderOutageStateSchema.index({ provider: 1, region: 1 });
ProviderOutageStateSchema.index({ outageState: 1, updatedAt: -1 });
ProviderOutageStateSchema.index({ provider: 1, outageState: 1 });

module.exports = mongoose.model("ProviderOutageState", ProviderOutageStateSchema);
