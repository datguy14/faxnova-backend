// src/models/OutboundFax.js
import mongoose from "mongoose";

const OutboundFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true
    },
    toNumber: {
      type: String,
      required: true
    },
    fromNumber: {
      type: String,
      required: true
    },
    pages: {
      type: Number,
      default: 1
    },
    mediaUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: [
        "queued",
        "sending",
        "delivered",
        "failed",
        "retrying",
        "provider_error"
      ],
      default: "queued"
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    retries: {
      type: Number,
      default: 0
    },
    residencyZone: {
      type: String,
      required: true
    },
    sovereignty: {
      type: String,
      required: true
    },
    providerMetadata: {
      type: Object,
      default: {}
    },
    sentAt: {
      type: Date,
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

export default mongoose.model("OutboundFax", OutboundFaxSchema);
