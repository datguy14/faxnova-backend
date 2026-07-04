// src/models/ApiKey.js

const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    label: {
      type: String
    },

    // Whether the key is active
    active: {
      type: Boolean,
      default: true
    },

    // Optional rate limit override per key
    rateLimit: {
      type: Number,
      default: null
    },

    // Optional metadata for key-specific settings
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

module.exports = mongoose.model("ApiKey", ApiKeySchema);
