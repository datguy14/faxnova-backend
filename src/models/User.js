const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "admin" // FaxNova is admin‑only today
    },

    apiKey: {
      type: String,
      unique: true,
      sparse: true // allows null without violating uniqueness
    },

    lastLoginAt: {
      type: Date
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", UserSchema);
