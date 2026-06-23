const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    user: { type: String },
    provider: { type: String },
    faxId: { type: String },
    status: { type: String },
    details: { type: Object },
    ip: { type: String },
    path: { type: String },
    method: { type: String },
    tenantId: { type: String },
    correlationId: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
