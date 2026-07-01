// src/models/WebhookEvent.js

const mongoose = require("mongoose");

const WebhookEventSchema = new mongoose.Schema({
  faxId: {
    type: String,
    index: true,
  },

  provider: {
    type: String,
    index: true,
  },

  providerFaxId: {
    type: String,
    index: true,
  },

  status: {
    type: String,
    index: true,
  },

  externalEventId: {
    type: String,
    required: true,
    unique: true, // idempotency
  },

  error: String,
  raw: Object,

  processedAt: {
    type: Date,
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Composite indexes
WebhookEventSchema.index({ provider: 1, status: 1 });
WebhookEventSchema.index({ faxId: 1, createdAt: -1 });

module.exports = mongoose.model("WebhookEvent", WebhookEventSchema);
