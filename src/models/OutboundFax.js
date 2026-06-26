// src/models/OutboundFax.js
const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema({
  to: { type: String, required: true },
  from: { type: String, required: true },
  status: { type: String, enum: ["queued", "sending", "sent", "failed"], default: "queued" },
  providerId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
