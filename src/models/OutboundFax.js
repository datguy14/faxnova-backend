// src/models/OutboundFax.js — Fully Updated, Production‑Ready (CommonJS Only)

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    // Destination number
    to: { type: String, required: true, index: true },

    // Provider chosen by routing engine
    provider: { type: String, required: true, index: true },

    // Provider-specific fax ID (Telnyx/Sinch)
    providerFaxId: { type: String, index: true },

    // Failover provider (Sinch ↔ Telnyx)
    failoverProvider: { type: String, default: null },

    // Storage key for the fax document
    storageKey: { type: String, required: true },

    // Status lifecycle
    status: {
      type: String,
      enum: ["queued", "processing", "sent", "failed"],
      default: "queued",
      index: true
    },

    // Region used for routing (us, eu, etc.)
    region: { type: String, required: true, index: true },

    // Tenant scoping (multi‑tenant SaaS)
    tenantId: { type: String, required: false, index: true },

    // Webhook correlation fields
    webhookStatus: { type: String, default: null },
    webhookRaw: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

// High‑performance indexes for workers and routing
OutboundFaxSchema.index({ provider: 1, status: 1 });
OutboundFaxSchema.index({ region: 1, status: 1 });
OutboundFaxSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
