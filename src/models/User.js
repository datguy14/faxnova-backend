// src/models/User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    },

    // Whether the user account is active
    active: {
      type: Boolean,
      default: true
    },

    // Optional metadata for user-specific settings
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

module.exports = mongoose.model("User", UserSchema);
