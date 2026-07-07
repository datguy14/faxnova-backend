const mongoose = require("mongoose");

const FaxEventSchema = new mongoose.Schema(
  {
    // Multi‑tenant SaaS
    tenantId: {
      type: String,
      required: true,
      index: true
    },

    // Reference to unified Fax model
    faxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fax",
      required: true,
      index: true
    },

    // High‑level event category
    type: {
      type: String,
      required: true,
      index: true
      // Examples:
      // PROVIDER_WEBHOOK_RECEIVED
      // OUTBOUND_FAX_SENT
      // INBOUND_FAX_RECEIVED
      // OUTBOUND_FAX_FAILOVER_TRIGGERED
      // BILLING_USAGE_EVENT
      // RESIDENCY_CHECK
      // IDEMPOTENCY_CHECK
    },

    // Optional fine‑grained action
    action: {
      type: String,
      default: null
      // Examples:
      // fax_sent
      // fax_received
      // failover_triggered
      // webhook_processed
    },

    // Provider context (optional)
    provider: {
      type: String,
      default: null,
      index: true
      // telnyx | sinch | null
    },

    // Provider status (optional)
    providerStatus: {
      type: String,
      default: null,
      index: true
      // delivered | failed | queued | processing | received | null
    },

    // Region context (optional)
    region: {
      type: String,
      default: null,
      index: true
      // us | eu | apac | etc.
    },

    // Arbitrary JSON payload
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true
    }
  },
  {
    versionKey: false,
    timestamps: false // we use createdAt only
  }
);

// High‑performance indexes for analytics + SLA dashboards
FaxEventSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
FaxEventSchema.index({ faxId: 1, type: 1 });
FaxEventSchema.index({ provider: 1, providerStatus: 1 });
FaxEventSchema.index({ region: 1, type: 1 });

module.exports = mongoose.model("FaxEvent", FaxEventSchema);
