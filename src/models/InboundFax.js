// src/models/InboundFax.js — STRICT-MODE FINAL

const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema(
  {
    // FaxNova internal ID
    faxId: {
      type: String,
      required: true,
      index: true
    },

    // Provider who delivered the inbound fax
    provider: {
      type: String,
      required: true,
      enum: ["sinch", "telnyx"]
    },

    // Sender (E.164 normalized)
    from: {
      type: String,
      required: true
    },

    // Recipient (E.164 normalized)
    to: {
      type: String,
      required: true
    },

    // Residency + sovereignty + routing region
    residencyZone: {
      type: String,
      default: "us"
    },
    sovereignty: {
      type: String,
      default: "us"
    },
    region: {
      type: String,
      default: "us"
    },

    // Storage reference (S3 key or local path)
    mediaKey: {
      type: String,
      required: true
    },

    // Status lifecycle
    status: {
      type: String,
      enum: [
        "received",
        "processing",
        "stored",
        "delivered",
        "failed"
      ],
      default: "received"
    },

    // Provider metadata
    providerMessageId: {
      type: String,
      default: null
    },

    providerStatus: {
      type: String,
      default: null
    },

    // Error details (if failed)
    errorMessage: {
      type: String,
      default: null
    },

    // Timestamps
    receivedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
