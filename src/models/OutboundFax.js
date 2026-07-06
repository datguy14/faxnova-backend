// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  providerFaxId: { type: String, required: true },
  to: { type: String, required: true },
  storageKey: { type: String, required: true },
  region: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
