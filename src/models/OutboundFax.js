// src/models/OutboundFax.js

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const OutboundFaxSchema = new mongoose.Schema({
  faxId: { type: String, default: uuidv4 },
  tenantId: { type: String, required: true },

  to: { type: String, required: true },
  from: { type: String, required: true },

  pages: { type: Number, required: true },
  documentUrl: { type: String, required: true },

  provider: { type: String },
  providerMessageId: { type: String },
  providerStatus: { type: Object },

  region: { type: String, enum: ["us", "eu", "global"], required: true },

  status: {
    type: String,
    enum: [
      "queued",
      "sending",
      "sent",
      "delivered",
      "failed",
      "retrying",
      "dead"
    ],
    default: "queued"
  },

  attempts: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
