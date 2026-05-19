const { mongoose } = require('../db');

const auditLogSchema = new mongoose.Schema({
  tenantId: { type: String, index: true, default: null },
  type: { type: String, index: true }, // fax, webhook, auth, system
  action: String,
  correlationId: String,
  ip: String,
  path: String,
  method: String,
  tier: String,
  details: Object
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
