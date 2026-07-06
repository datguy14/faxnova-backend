// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    provider: { type: String, required: true },
    providerFaxId: { type: String },
    storageKey: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "sent", "failed"],
      default: "queued"
    },
    region: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
