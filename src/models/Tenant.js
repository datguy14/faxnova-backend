// src/models/Tenant.js

const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true
    },

    // Region residency rules reference
    residencyRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResidencyRule",
      required: true
    },

    // Billing tier (affects rate limits, features, etc.)
    apiTier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },

    // Webhook URL for inbound fax notifications
    webhookUrl: {
      type: String
    },

    // Whether inbound webhooks are enabled
    webhookEnabled: {
      type: Boolean,
      default: true
    },

    // Optional metadata for tenant-specific settings
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("Tenant", TenantSchema);
