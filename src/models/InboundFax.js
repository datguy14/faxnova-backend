// src/models/InboundFax.js — Unified Fax Architecture (CommonJS Only)

const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  provider: { type: String, required: true },
  providerFaxId: { type: String, required: true },
  region: { type: String, required: true },
  direction: { type: String, default: "inbound" },
  storageKey: { type: String, required: true },
  status: { type: String, default: "received" },
  rawInbound: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
