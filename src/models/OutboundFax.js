// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true,          // UUID used across workers/webhooks
      unique: true
    },

    toNumber: {
      type: String,
      required: true,
      index: true
    },

    fromNumber: {
      type: String,
      required: true
    },

    provider: {
      type: String,
      required: true,
      index: true           // sinch, telnyx, etc.
    },

    providerMessageId: {
      type: String,
      index: true           // provider’s own ID
    },

    status: {
      type: String,
      enum: [
        "queued",
        "sending",
        "delivered",
        "failed",
        "canceled"
      ],
      default: "queued",
      index: true
    },

    attempts: {
      type: Number,
      default: 0            // incremented by outbound/retry workers
    },

    lastAttemptAt: {
      type: Date
    },

    errorCode: {
      type: String
    },

    errorMessage: {
      type: String
    },

    metadata: {
      type: Object
    }
  },
  {
    timestamps: true
  }
);

OutboundFaxSchema.index({ provider: 1, status: 1 });
OutboundFaxSchema.index({ faxId: 1, provider: 1 });

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
