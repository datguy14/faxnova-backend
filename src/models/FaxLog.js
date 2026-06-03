// src/models/FaxLog.js
const mongoose = require("mongoose");

const FaxLogSchema = new mongoose.Schema(
  {
    faxId: { type: mongoose.Schema.Types.ObjectId, ref: "Fax", required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "sent", "retried", "deleted"
    message: { type: String },
    metadata: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FaxLog", FaxLogSchema);
