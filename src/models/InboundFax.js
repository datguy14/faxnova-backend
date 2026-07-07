const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema(
  {
    // Internal FaxNova ID (if outbound correlation exists)
    faxId: { type: String, index: true },

    // Provider (telnyx | sinch)
    provider: { type: String, required: true, index: true },

    // Provider fax ID (always present)
    providerFaxId: { type: String, required: true, index: true },

    // Provider status (delivered, failed, queued, processing)
    providerStatus: {
      type: String,
      enum: ["delivered", "failed", "queued", "processing", "unknown"],
      default: "unknown",
      index: true
    },

    // Region (us, eu, etc.)
    region: { type: String, default: "us", index: true },

    // Tenant scoping (multi‑tenant SaaS)
    tenantId: { type: String, index: true },

    // Raw webhook payload (for debugging, billing, SLA)
    raw: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

// High‑performance indexes for analytics + SLA dashboards
InboundFaxSchema.index({ provider: 1, providerStatus: 1 });
InboundFaxSchema.index({ region: 1, providerStatus: 1 });
InboundFaxSchema.index({ tenantId: 1, providerStatus: 1 });

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
