// src/models/WebhookEvent.js
const mongoose = require("mongoose");

const WebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  provider: { type: String },
  payload: { type: Object },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WebhookEvent", WebhookEventSchema);
