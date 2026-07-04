// src/models/OutboundFax.js — STRICT-MODE FINAL

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    // FaxNova internal ID
    faxId: {
      type: String,
      required: true,
      index: true
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

    // Provider selected by providerRoutingEngine
    provider: {
      type: String,
      required: true,
      enum: ["sinch", "telnyx"]
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
        "queued",
        "processing",
        "sending",
        "delivered",
        "failed",
        "retrying"
      ],
      default: "queued"
    },

    // Provider delivery metadata
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
    queuedAt: {
      type: Date,
      default: Date.now
    },
    sentAt: {
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

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
