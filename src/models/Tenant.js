const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },

  apiKey: { type: String, required: true, unique: true },

  providers: {
    primary: { type: String, required: true },   // telnyx | sinch
    failover: { type: String, required: true }   // telnyx | sinch
  },

  residencyZone: { type: String, default: "us" },

  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", TenantSchema);
