// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema({
  to: String,
  from: String,
  mediaUrl: String,
  callbackUrl: String,

  provider: String,
  providerFaxId: String,
  status: String,
  error: String,

  sovereigntyConstraints: {
    type: Object,
    default: {},
  },

  residencyZone: {
    type: String,
    enum: ["us", "eu", "ca"],
    required: true,
    default: "us",
  },

  residencyDecisionLog: [
    {
      provider: String,
      region: String,
      decidedAt: Date,
      reason: String,
    },
  ],

  createdAt: { type: Date, default: Date.now },
  lastEventAt: { type: Date },
});

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
