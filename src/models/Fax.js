// src/models/Fax.js

const mongoose = require("mongoose");

const FaxSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true
    },

    // Outbound: "to"
    // Inbound: "from"
    to: { type: String },
    from: { type: String },

    region: {
      type: String,
      required: true
    },

    storageKey: {
      type: String,
      required: true
    },

    provider: {
      type: String
    },

    providerMessageId: {
      type: String
    },

    status: {
      type: String,
      enum: [
        "queued",
        "sending",
        "sent",
        "failed",
        "received"
      ],
      required: true
    },

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

module.exports = mongoose.model("Fax", FaxSchema);
