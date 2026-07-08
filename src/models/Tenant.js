// src/models/Tenant.js — Unified Fax Architecture (CommonJS Only)

const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  residencyZone: { type: String, default: "us" },
  tier: { type: String, default: "standard" },
  providers: {
    primary: { type: String, default: "telnyx" },
    failover: { type: String, default: "sinch" }
  }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", TenantSchema);
