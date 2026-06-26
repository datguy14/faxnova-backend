const mongoose = require("mongoose");

const faxSchema = new mongoose.Schema(
  {
    faxId: { type: String, unique: true, index: true },
    tenantId: { type: String, index: true },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    provider: { type: String, enum: ["Sinch", "Telnyx"], required: true },
    status: { type: String, enum: ["processing", "delivered", "failed"], required: true },
    retries: { type: Number, default: 0 },

    rawProviderPayload: {
      providerMessageId: String,
      errorCode: String,
      errorMessage: String,
      pages: Number,
      durationSeconds: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fax", faxSchema);
