// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema({
  to: String,
  from: String,
  mediaUrl: String,
  callbackUrl: String,

  provider: {
    type: String,
    index: true, // high-cardinality
  },

  providerFaxId: {
    type: String,
    index: true,
  },

  status: {
    type: String,
    index: true, // high-cardinality
  },

  userId: {
    type: String,
    index: true, // multi-tenant SaaS
  },

  sovereigntyConstraints: {
    type: Object,
    default: {},
  },

  residencyZone: {
    type: String,
    enum: ["us", "eu", "ca"],
    required: true,
    default: "us",
    index: true, // sovereignty routing
  },

  residencyDecisionLog: [
    {
      provider: String,
      region: String,
      decidedAt: Date,
      reason: String,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // dashboards + analytics
  },

  lastEventAt: {
    type: Date,
    index: true,
  },
});

// Composite indexes
OutboundFaxSchema.index({ provider: 1, status: 1 });
OutboundFaxSchema.index({ userId: 1, createdAt: -1 });
OutboundFaxSchema.index({ residencyZone: 1, status: 1 });
OutboundFaxSchema.index({ "sovereigntyConstraints.region": 1, status: 1 });

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
