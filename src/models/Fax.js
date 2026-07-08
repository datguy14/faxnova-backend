const mongoose = require("mongoose");

const FaxSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },

  // Outbound fields
  to: { type: String, default: null },
  from: { type: String, default: null },

  // Provider fields
  provider: { type: String, default: null }, // telnyx | sinch
  providerFaxId: { type: String, default: null },
  providerStatus: { type: String, default: "pending" }, // pending | sent | delivered | failed | error

  // Storage
  storageKey: { type: String, default: null },

  // Region
  region: { type: String, default: "us" },

  // Failover
  failoverUsed: { type: Boolean, default: false },

  // Inbound fields
  inbound: {
    isInbound: { type: Boolean, default: false },
    pdfUrl: { type: String, default: null }
  },

  // Metadata
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("Fax", FaxSchema);
