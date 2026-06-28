// src/models/OutboundFax.js

const mongoose = require("mongoose");

const OutboundFaxSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    provider: {
      type: String,
      enum: ["sinch", "telnyx"],
      required: true
    },

    failoverProvider: {
      type: String,
      enum: ["sinch", "telnyx", null],
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
      default: 1
    },

    documentUrl: {
      type: String,
      required: true
    },

    residencyZone: {
      type: String,
      enum: ["us", "eu", "global"],
      required: true
    },

    sovereignty: {
      type: String,
      enum: ["domestic", "foreign"],
      default: "domestic"
    },

    tier: {
      type: String,
      enum: ["basic", "pro", "enterprise"],
      default: "basic"
    },

    jobId: {
      type: String,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["queued", "sending", "delivered", "failed"],
      default: "queued",
      index: true
    },

    errorCode: {
      type: String,
      default: null
    },

    errorMessage: {
      type: String,
      default: null
    },

    latencyMs: {
      type: Number,
      default: null
    },

    routingScore: {
      type: Number,
      default: null
    },

    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for dashboard + analytics
OutboundFaxSchema.index({ tenantId: 1, createdAt: -1 });
OutboundFaxSchema.index({ provider: 1, status: 1 });
OutboundFaxSchema.index({ residencyZone: 1 });
OutboundFaxSchema.index({ sovereignty: 1 });

module.exports = mongoose.model("OutboundFax", OutboundFaxSchema);
