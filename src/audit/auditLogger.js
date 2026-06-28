// src/audit/auditLogger.js

const AuditLog = require("../models/AuditLog");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Unified audit logging function.
 * Every audit event is structured and tenant‑scoped.
 *
 * Required fields:
 * - tenantId
 * - type
 * - action
 *
 * Optional fields:
 * - correlationId
 * - ip
 * - path
 * - method
 * - tier
 * - details (object)
 */
async function logEvent(event = {}) {
  try {
    const {
      tenantId,
      type,
      action,
      correlationId,
      ip,
      path,
      method,
      tier,
      details = {}
    } = event;

    if (!tenantId) {
      throw new FaxNovaError("Missing tenantId in audit event", {
        code: "AUDIT_TENANT_MISSING"
      });
    }

    if (!type || !action) {
      throw new FaxNovaError("Missing type or action in audit event", {
        code: "AUDIT_FIELDS_MISSING"
      });
    }

    await AuditLog.create({
      tenantId,
      type,
      action,
      correlationId: correlationId || null,
      ip: ip || null,
      path: path || null,
      method: method || null,
      tier: tier || null,
      details,
      timestamp: new Date()
    });

  } catch (err) {
    console.error("Audit log error:", err.message);

    // Never throw — audit failures must not break API flow
    return;
  }
}

module.exports = {
  logEvent
};
