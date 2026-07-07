const mongoose = require("mongoose");

const FaxSchema = new mongoose.Schema(
  {
    // Multi-tenant SaaS
    tenantId: { type: String, required: true, index: true },

    // Direction: inbound or outbound
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true
    },

    // Destination or source number
    to: { type: String, index: true },
    from: { type: String, index: true },

    // Provider (telnyx | sinch)
    provider: { type: String, index: true },

    // Provider fax ID (always present for outbound + webhook events)
    providerFaxId: { type: String, index: true },

    // Failover provider (outbound only)
    failoverProvider: { type: String, default: null },

    // Storage key for inbound/outbound PDF
    storageKey: { type: String, required: true },

    // Region (us, eu, etc.)
    region: { type: String, required: true, index: true },

    // Status lifecycle (shared for inbound + outbound)
    status: {
      type: String,
      enum: [
        "queued",
        "processing",
        "sent",
        "failed",
        "received",
        "delivered",
        "unknown"
      ],
      default: "queued",
      index: true
    },

    // Raw webhook payload (optional)
    webhookRaw: { type: mongoose.Schema.Types.Mixed, default: null },

    // Provider webhook status (delivered, failed, etc.)
    webhookStatus: { type: String, default: null },

    // Arbitrary metadata (inbound or outbound)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// High-performance indexes for workers, analytics, SLA dashboards
FaxSchema.index({ provider: 1, status: 1 });
FaxSchema.index({ region: 1, status: 1 });
FaxSchema.index({ tenantId: 1, status: 1 });
FaxSchema.index({ direction: 1, status: 1 });

module.exports = mongoose.model("Fax", FaxSchema);
