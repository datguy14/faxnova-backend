// src/models/InboundFax.js
import mongoose from "mongoose";

const InboundFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true
    },
    fromNumber: {
      type: String,
      required: true
    },
    toNumber: {
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
    residencyZone: {
      type: String,
      required: true
    },
    sovereignty: {
      type: String,
      required: true
    },
    tenantId: {
      type: String,
      default: null,
      index: true
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("InboundFax", InboundFaxSchema);
