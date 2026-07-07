// src/services/auditService.js — Unified Fax Model Compatible (CommonJS Only)

const FaxEvent = require("../models/FaxEvent");

/**
 * Unified Audit Logging Service
 *
 * Responsibilities:
 * - Record all fax lifecycle events (inbound + outbound)
 * - Record provider webhook events
 * - Record billing usage events
 * - Record failover triggers
 * - Record residency + idempotency events
 * - Multi-tenant SaaS analytics
 */
exports.logEvent = async ({
  tenantId,
  faxId,
  type,
  action = null,
  provider = null,
  providerStatus = null,
  region = null,
  details = {}
}) => {
  try {
    await FaxEvent.create({
      tenantId,
      faxId,
      type,            // e.g., PROVIDER_WEBHOOK_RECEIVED
      action,          // optional: fax_received, fax_sent, failover_triggered
      provider,        // telnyx | sinch | null
      providerStatus,  // delivered | failed | queued | processing | null
      region,          // us | eu | apac | null
      details,         // arbitrary JSON payload
      createdAt: new Date()
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
