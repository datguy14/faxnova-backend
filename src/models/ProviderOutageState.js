// src/models/ProviderOutageState.js

const mongoose = require("mongoose");

const ProviderOutageStateSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      index: true
    },

    state: {
      type: String,
      enum: ["closed", "open", "half-open"],
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

    halfOpenAt: {
      type: Date
    },

    recoveredAt: {
      type: Date
    }
  },
  { timestamps: true }
);

ProviderOutageStateSchema.index({ provider: 1, state: 1 });
ProviderOutageStateSchema.index({ provider: 1, openedAt: -1 });
ProviderOutageStateSchema.index({ provider: 1, lastFailureAt: -1 });

module.exports = mongoose.model("ProviderOutageState", ProviderOutageStateSchema);
