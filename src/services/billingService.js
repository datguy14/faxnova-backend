// src/services/billingService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const auditService = require("./auditService");

/**
 * Billing Service — Unified Edition
 *
 * Responsibilities:
 * - Track billable fax events (send, deliver, fail, inbound receive)
 * - Multi-tenant usage tracking
 * - Provider-aware cost modeling
 * - Region-aware cost modeling
 * - Unified Fax model compatibility
 *
 * NOTE:
 * This service does NOT charge customers directly.
 * It records usage events that your billing engine can aggregate later.
 */

module.exports = {
  /**
   * Provider webhook lifecycle event (delivered, failed, queued, etc.)
   */
  async trackWebhookEvent({ faxId, tenantId, provider, providerStatus }) {
    const fax = await Fax.findById(faxId);
    if (!fax) {
      console.error("BillingService: Fax not found:", faxId);
      return;
    }

    let billableEvent = null;

    // Outbound billable events
    if (fax.direction === "outbound") {
      if (providerStatus === "delivered") billableEvent = "outbound_fax_delivered";
      if (providerStatus === "failed") billableEvent = "outbound_fax_failed";
    }

    // Inbound billable events
    if (fax.direction === "inbound") {
      if (providerStatus === "received" || providerStatus === "delivered") {
        billableEvent = "inbound_fax_received";
      }
    }

    if (!billableEvent) return;

    await auditService.logEvent({
      type: "BILLING_USAGE_EVENT",
      tenantId,
      faxId,
      provider,
      providerStatus,
      billableEvent,
      region: fax.region
    });

    return {
      faxId,
      tenantId,
      provider,
      providerStatus,
      billableEvent,
      region: fax.region
    };
  },

  /**
   * Outbound fax was successfully queued for sending.
   */
  async trackOutboundQueued({ faxId, tenantId }) {
    await auditService.logEvent({
      type: "BILLING_OUTBOUND_QUEUED",
      faxId,
      tenantId
    });
  },

  /**
   * Outbound fax was sent to provider (pre-delivery).
   */
  async trackOutboundSend({ faxId }) {
    const fax = await Fax.findById(faxId);
    if (!fax) return;

    await auditService.logEvent({
      type: "BILLING_OUTBOUND_SENT",
      faxId,
      tenantId: fax.tenantId,
      provider: fax.provider,
      region: fax.region
    });
  },

  /**
   * Inbound fax was created (pre-webhook).
   */
  async trackInboundReceived({ faxId }) {
    const fax = await Fax.findById(faxId);
    if (!fax) return;

    await auditService.logEvent({
      type: "BILLING_INBOUND_RECEIVED",
      faxId,
      tenantId: fax.tenantId,
      provider: fax.provider,
      region: fax.region
    });
  },

  /**
   * Failover event triggered by webhook or worker.
   */
  async trackFailover({ faxId, failoverProvider }) {
    const fax = await Fax.findById(faxId);
    if (!fax) return;

    await auditService.logEvent({
      type: "BILLING_FAILOVER_TRIGGERED",
      faxId,
      tenantId: fax.tenantId,
      provider: fax.provider,
      failoverProvider,
      region: fax.region
    });
  }
};
