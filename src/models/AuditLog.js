const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },          // e.g., "fax_sent", "provider_failover"
    user: { type: String },                            // userId or system
    provider: { type: String },                        // sinch, telnyx, etc.
    faxId: { type: String },                           // fax UUID
    status: { type: String },                          // success, failed, retry, etc.
    details: { type: Object },                         // payload, metadata, error info
    ip: { type: String },                              // request IP
    path: { type: String },                            // endpoint hit
    method: { type: String },                          // GET/POST/etc.
    tenantId: { type: String },                        // multi-tenant support
    correlationId: { type: String },                   // tracing
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
