// src/models/IdempotencyRecord.js

const mongoose = require("mongoose");

const IdempotencyRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    key: {
      type: String,
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 10 // auto-expire after 10 minutes
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("IdempotencyRecord", IdempotencyRecordSchema);
