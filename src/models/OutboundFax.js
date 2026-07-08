// src/models/OutboundFax.js — Unified Fax Architecture (CommonJS Only)

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  to: { type: String, required: true },
  provider: { type: String, required: true },
  failoverProvider: { type: String, default: null },
  region: { type: String, required: true },
  storageKey: { type: String, required: true },
  providerFaxId: { type: String, default: null },
  status: { type: String, default: "queued" }, // queued, processing, delivered, failed
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
