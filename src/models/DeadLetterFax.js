const mongoose = require("mongoose");

const DeadLetterFaxSchema = new mongoose.Schema(
  {
    faxId: {
      type: String,
      required: true,
      index: true
    },

    provider: {
      type: String,
      index: true
    },

    providerMessageId: {
      type: String,
      index: true
    },

    region: {
      type: String
    },

    attempts: {
      type: Number,
      default: 0
    },

    errorCode: {
      type: String
    },

    errorMessage: {
      type: String
    },

    payload: {
      type: Object
    },

    metadata: {
      type: Object
    }
  },
  {
    timestamps: true
  }
);

// Helpful indexes for admin + diagnostics
DeadLetterFaxSchema.index({ faxId: 1 });
DeadLetterFaxSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model("DeadLetterFax", DeadLetterFaxSchema);
