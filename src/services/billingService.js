// src/services/billingService.js — Unified Fax Model Compatible (CommonJS Only)

const Fax = require("../models/Fax");
const auditService = require("./auditService");

/**
 * Billing Service
 *
 * Responsibilities:
 * - Track billable fax events (send, deliver, fail)
 * - Multi-tenant usage tracking
 * - Provider-aware cost modeling
 * - Region-aware cost modeling
 * - Unified Fax model compatibility
 *
 * NOTE:
 * This service does NOT charge customers directly.
 * It records usage events that your billing engine can aggregate later.
 */

exports.trackWebhookEvent = async ({ faxId, tenantId, provider, providerStatus }) => {
  // ----------------------------------------
  // 1. Load unified Fax record
  // ----------------------------------------
  const fax = await Fax.findById(faxId);
  if (!fax) {
    console.error("BillingService: Fax not found:", faxId);
    return;
  }

  // ----------------------------------------
  // 2. Determine billable event type
  // ----------------------------------------
  let billableEvent = null;

  if (fax.direction === "outbound") {
    if (providerStatus === "delivered") billableEvent = "outbound_fax_delivered";
    if (providerStatus === "failed") billableEvent = "outbound_fax_failed";
  }

  if (fax.direction === "inbound") {
    if (providerStatus === "received" || providerStatus === "delivered") {
      billableEvent = "inbound_fax_received";
    }
  }

  if (!billableEvent) {
    // Not a billable event → ignore silently
    return;
  }

  // ----------------------------------------
  // 3. Record usage event (billable)
  // ----------------------------------------
  await auditService.logEvent({
    type: "BILLING_USAGE_EVENT",
    tenantId,
    faxId,
    provider,
    providerStatus,
    billableEvent,
    region: fax.region
  });

  // ----------------------------------------
  // 4. Return usage record for worker
  // ----------------------------------------
  return {
    faxId,
    tenantId,
    provider,
    providerStatus,
    billableEvent,
    region: fax.region
  };
};

/**
 * Track outbound send events (pre‑delivery)
 */
exports.trackOutboundSend = async ({ faxId }) => {
  const fax = await Fax.findById(faxId);
  if (!fax) return;

  await auditService.logEvent({
    type: "BILLING_OUTBOUND_SEND",
    faxId,
    tenantId: fax.tenantId,
    provider: fax.provider,
    region: fax.region
  });
};

/**
 * Track inbound fax creation (pre‑webhook)
 */
exports.trackInboundReceived = async ({ faxId }) => {
  const fax = await Fax.findById(faxId);
  if (!fax) return;

  await auditService.logEvent({
    type: "BILLING_INBOUND_RECEIVED",
    faxId,
    tenantId: fax.tenantId,
    provider: fax.provider,
    region: fax.region
  });
};
