const mongoose = require("mongoose");

const AuditEventSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., OUTBOUND_FAX_SENT, INBOUND_FAX_RECEIVED, PROVIDER_ERROR
  faxId: { type: String, default: null },
  tenantId: { type: String, default: null },
  provider: { type: String, default: null },
  region: { type: String, default: null },
  details: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("AuditEvent", AuditEventSchema);
