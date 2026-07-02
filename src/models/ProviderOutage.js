// src/models/ProviderOutage.js

const mongoose = require("mongoose");

const ProviderOutageSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      index: true,
      required: true
    },

    region: {
      type: String,
      index: true
    },

    outageType: {
      type: String,
      enum: ["partial", "full", "degraded"],
      required: true
    },

    detectedAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    resolvedAt: {
      type: Date,
      index: true
    },

    details: {
      type: Object,
      default: {}
    },

    attemptsMade: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

ProviderOutageSchema.index({ provider: 1, region: 1 });
ProviderOutageSchema.index({ outageType: 1, detectedAt: -1 });

module.exports = mongoose.model("ProviderOutage", ProviderOutageSchema);
