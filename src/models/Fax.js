// src/models/Fax.js
const mongoose = require("mongoose");

const FaxSchema = new mongoose.Schema({
  direction: { type: String, enum: ["inbound", "outbound"], required: true },
  from: { type: String },
  to: { type: String },
  provider: { type: String },
  status: { type: String, enum: ["queued", "sending", "sent", "failed", "received"] },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Fax", FaxSchema);
