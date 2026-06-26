// src/models/Fax.js

const mongoose = require("mongoose");

const FaxSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },

    provider: {
      type: String,
      required: true,
      index: true
    },

    failoverProvider: {
      type: String,
      default: null
    },

    routingScore: {
      type: Number,
      default: null
    },

    to: {
      type: String,
      required: true
    },

    from: {
      type: String,
      required: true
    },

    pages: {
      type: Number,
      required: true
    },

    documentUrl: {
      type: String,
      required: true
    },

    jobId: {
      type: String,
      required: true,
      index: true
    },

    residencyZone: {
      type: String,
      required: true,
      index: true
    },

    tier: {
      type: String,
      default: "basic"
    },

    status: {
      type: String,
      enum: [
        "sent",
        "queued",
        "delivered",
        "failed",
        "retrying",
        "provider_error"
      ],
      default: "sent",
      index: true
    },

    latencyMs: {
      type: Number,
      default: null
    },

    deliveryTimeMs: {
      type: Number,
      default: null
    },

    errorCode: {
      type: String,
      default: null
    },

    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// -----------------------------
// Indexes for analytics + speed
// -----------------------------

FaxSchema.index({ tenantId: 1, createdAt: -1 });
FaxSchema.index({ provider: 1, createdAt: -1 });
FaxSchema.index({ residencyZone: 1, createdAt: -1 });
FaxSchema.index({ status: 1, createdAt: -1 });
FaxSchema.index({ jobId: 1 });

module.exports = mongoose.model("Fax", FaxSchema);
