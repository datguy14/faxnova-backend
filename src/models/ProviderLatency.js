const mongoose = require("mongoose");

const ProviderLatencySchema = new mongoose.Schema({
  provider: { type: String, required: true }, // telnyx | sinch
  faxId: { type: String, required: true },
  tenantId: { type: String, required: true },
  latencyMs: { type: Number, required: true },
  region: { type: String, default: "us" }
}, { timestamps: true });

module.exports = mongoose.model("ProviderLatency", ProviderLatencySchema);
