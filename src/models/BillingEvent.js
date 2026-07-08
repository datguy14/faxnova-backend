const mongoose = require("mongoose");

const BillingEventSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  faxId: { type: String, default: null },
  direction: { type: String, enum: ["outbound", "inbound", "webhook"], required: true },
  provider: { type: String, required: true },
  eventType: { type: String, required: true }, // outbound_send, inbound_received, delivery_receipt, provider_error, etc.
  region: { type: String, required: true },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("BillingEvent", BillingEventSchema);
