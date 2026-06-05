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
  },
  { timestamps: true }
);

export default mongoose.model("Fax", faxSchema);
