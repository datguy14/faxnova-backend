// src/models/ResidencyRule.js

const mongoose = require("mongoose");

const ResidencyRuleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    outbound: {
      allowed: {
        type: [String],
        default: []
      },
      blocked: {
        type: [String],
        default: []
      },
      strict: {
        type: Boolean,
        default: false
      }
    },

    inbound: {
      allowed: {
        type: [String],
        default: []
      },
      blocked: {
        type: [String],
        default: []
      },
      strict: {
        type: Boolean,
        default: false
      }
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

module.exports = mongoose.model("ResidencyRule", ResidencyRuleSchema);
