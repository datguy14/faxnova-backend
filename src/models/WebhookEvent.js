// src/models/WebhookEvent.js

const mongoose = require("mongoose");

const WebhookEventSchema = new mongoose.Schema(
  {
    externalEventId: {
      type: String,
      required: true,
      unique: true,         // idempotency key
      index: true
    },

    provider: {
      type: String,
      required: true,
      index: true
    },

    faxId: {
      type: String,
      index: true           // links webhook → OutboundFax
    },

    status: {
      type: String,
      index: true           // delivered, failed, etc.
    },

    providerStatus: {
      type: String
    },

    errorCode: {
      type: String
    },

    errorMessage: {
      type: String
    },

    raw: {
      type: Object,         // full payload for debugging
      required: true
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

WebhookEventSchema.index({ provider: 1, faxId: 1, status: 1 });

module.exports = mongoose.model("WebhookEvent", WebhookEventSchema);
