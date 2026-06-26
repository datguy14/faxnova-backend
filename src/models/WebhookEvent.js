const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, index: true },
  receivedAt: { type: Date, default: Date.now, expires: 86400 } // 24h TTL
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
