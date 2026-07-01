// src/models/WebhookEvent.js

const mongoose = require("mongoose");

const WebhookEventSchema = new mongoose.Schema({
  faxId: String,
  provider: String,
  providerFaxId: String,
  status: String,
  error: String,
  raw: Object,

  externalEventId: {
    type: String,
    required: true,
    unique: true, // DB-level idempotency
  },

  processedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

WebhookEventSchema.index({ externalEventId: 1 }, { unique: true });

module.exports = mongoose.model("WebhookEvent", WebhookEventSchema);
