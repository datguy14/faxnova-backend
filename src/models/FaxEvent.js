const mongoose = require("mongoose");

const FaxEventSchema = new mongoose.Schema(
  {
    // Multi‑tenant SaaS
    tenantId: { type: String, required: true, index: true },

    // Optional link to Fax record
    faxId: { type: String, index: true },

    // Event type (billing, webhook, failover, inbound, outbound, etc.)
    type: { type: String, required: true, index: true },

    // Optional action (fax_sent, fax_received, webhook_event, etc.)
    action: { type: String, default: null },

    // Provider (telnyx | sinch)
    provider: { type: String, default: null, index: true },

    // Provider status (delivered, failed, queued, processing, received)
    providerStatus: { type: String, default: null, index: true },

    // Region (us, eu, apac, etc.)
    region: { type: String, default: null, index: true },

    // Arbitrary details (metadata, raw webhook, failover info, etc.)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Timestamp of event
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

// High‑performance indexes for analytics, SLA dashboards, billing
FaxEventSchema.index({ tenantId: 1, type: 1, timestamp: -1 });
FaxEventSchema.index({ faxId: 1, type: 1, timestamp: -1 });
FaxEventSchema.index({ provider: 1, providerStatus: 1, timestamp: -1 });
FaxEventSchema.index({ region: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model("FaxEvent", FaxEventSchema);
