const mongoose = require("mongoose");

const InboundFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true
    },

    provider: {
      type: String,
      enum: ["sinch", "telnyx"],
      required: true,
      index: true
    },

    providerMessageId: {
      type: String,
      required: true,
      index: true
    },

    fromNumber: {
      type: String,
      required: true
    },

    toNumber: {
      type: String,
      required: true,
      index: true
    },

    documentUrl: {
      type: String,
      required: true
    },

    pages: {
      type: Number,
      default: 1
    },

    rawPayload: {
      type: Object,
      required: true
    },

    residencyZone: {
      type: String,
      enum: ["us", "eu"],
      required: true,
      index: true
    },

    sovereignty: {
      type: String,
      enum: ["us", "eu"],
      required: true
    },

    region: {
      type: String,
      enum: ["us", "eu"],
      default: "us"
    },

    tenantId: {
      type: String,
      required: true,
      index: true
    },

    userId: {
      type: String
    },

    status: {
      type: String,
      enum: ["received", "processing", "completed", "failed"],
      default: "received"
    },

    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
InboundFaxSchema.index({ tenantId: 1, receivedAt: -1 });
InboundFaxSchema.index({ provider: 1, receivedAt: -1 });
InboundFaxSchema.index({ residencyZone: 1, receivedAt: -1 });
InboundFaxSchema.index({ faxId: 1 });
InboundFaxSchema.index({ toNumber: 1 });

module.exports = mongoose.model("InboundFax", InboundFaxSchema);
