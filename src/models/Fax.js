import mongoose from "mongoose";

const faxSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      lowercase: true, // normalize provider for controller logic
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    faxId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "queued", "delivered", "failed"],
      default: "sent",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    /**
     * Data Residency Fields
     * Track sovereignty compliance and multi-provider routing
     */
    residencyZone: {
      type: String,
      enum: ["us-east-tribal", "eu-sovereign", "global"],
      default: "global",
      index: true, // Index for residency-based queries
      description: "Data sovereignty zone (us-east-tribal, eu-sovereign, global)",
    },
    primaryProvider: {
      type: String,
      lowercase: true,
      enum: ["sinch", "telnyx", null],
      default: null,
      description: "Primary provider attempted for delivery",
    },
    fallbackProvider: {
      type: String,
      lowercase: true,
      enum: ["sinch", "telnyx", null],
      default: null,
      description: "Fallback provider used if primary failed",
    },
    failoverUsed: {
      type: Boolean,
      default: false,
      description: "True if failover to alternate provider was triggered",
    },
  },
  { timestamps: true }
);

// Compound index for residency zone + status queries
faxSchema.index({ residencyZone: 1, status: 1 });

// Index for failover analysis
faxSchema.index({ failoverUsed: 1, createdAt: -1 });

export default mongoose.model("Fax", faxSchema);
