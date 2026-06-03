const mongoose = require("mongoose");

const FaxLogSchema = new mongoose.Schema(
  {
    faxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fax",
      required: true
    },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true,
      enum: [
        "sent",
        "queued",
        "retried",
        "failed",
        "completed",
        "deleted",
        "webhook_received",
        "status_update"
      ]
    },

    message: {
      type: String
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FaxLog", FaxLogSchema);
