// src/models/FaxEvent.js

const mongoose = require("mongoose");

const FaxEventSchema = new mongoose.Schema(
  {
    faxId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "fax_outbound",
        "fax_inbound",
        "provider_callback",
        "status_update"
      ],
      required: true
    },

    action: {
      type: String,
      required: true
    },

    provider: {
      type: String
    },

    providerMessageId: {
      type: String
    },

    details: {
      type: mongoose.Schema.Types.Mixed
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("FaxEvent", FaxEventSchema);
