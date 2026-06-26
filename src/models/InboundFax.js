// src/models/InboundFax.js

const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true
    },

    provider: {
      type: String,
      required: true,
      index: true
    },

    fromNumber: {
      type: String,
      required: true
    },

    toNumber: {
      type: String,
      required: true,
      index: true
    },

    pages: {
      type: Number,
      default: 1
    },

    mediaUrl: {
      type: String,
      required: true
    },

    residencyZone: {
      type: String,
      required: true,
      index: true
    },

    sovereignty: {
      type: String,
      required: true
    },

    tenantId: {
      type: String,
      required: true,
      index: true
    },

    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// -----------------------------
// Indexes for analytics + speed
// -----------------------------

InboundFaxSchema.index({ tenantId: 1, receivedAt: -1 });
InboundFaxSchema.index({ provider: 1, receivedAt: -1 });
InboundFaxSchema.index({ residencyZone: 1, receivedAt: -1 });
InboundFaxSchema.index({ faxId: 1 });
InboundFaxSchema.index({ toNumber: 1 });

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
