// src/models/OutboundFax.js — CommonJS Strict‑Mode Version

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    provider: { type: String, required: true },
    providerFaxId: { type: String },
    storageKey: { type: String, required: true },
    region: { type: String, required: true },
    status: { type: String, default: "pending" },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
