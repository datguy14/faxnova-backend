// src/models/InboundFax.js

const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    providerFaxId: { type: String, required: true },
    from: { type: String, required: true },
    storageKey: { type: String, required: true },
    status: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
