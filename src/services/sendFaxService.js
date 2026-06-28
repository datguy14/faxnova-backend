// src/services/sendFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const providerRouter = require("../providers/providerRouter");
const sinch = require("../providers/sinchAdapter");
const telnyx = require("../providers/telnyxAdapter");
const audit = require("../audit/auditService");

// Unified provider map
const providerMap = {
  sinch,
  telnyx
};

/**
 * sendFaxService
 *
 * Handles:
 * - Routing Engine v2 provider selection
 * - Primary send attempt
 * - Failover send attempt
 * - Latency tracking
 * - Audit logging
 *
 * Input:
 * {
 *   tenantId,
 *   to,
 *   from,
 *   pages,
 *   documentUrl,
 *   residencyZone,
 *   tier
 * }
 *
 * Output:
 * {
 *   provider,
 *   failoverProvider,
 *   jobId,
 *   latencyMs,
 *   routingScore
 * }
 */

async function sendFax({
  tenantId,
  to,
  from,
  pages,
  documentUrl,
  residencyZone,
  tier
}) {
  try {
    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    // -----------------------------
    // 1. Routing Engine v2
    // -----------------------------
    const route = await providerRouter.routeProvider({
      residencyZone,
      tier
    });

    const primaryProviderName = route.provider;
    const failoverProviderName = route.failoverProvider;

    const primaryProvider = providerMap[primaryProviderName];
    const failoverProvider = failoverProviderName
      ? providerMap[failoverProviderName]
      : null;

    if (!primaryProvider) {
      throw new FaxNovaError("Invalid primary provider", {
        code: "PRIMARY_PROVIDER_INVALID",
        provider: primaryProviderName
      });
    }

    // -----------------------------
    // 2. Primary provider attempt
    // -----------------------------
    const primaryStart = Date.now();

    try {
      const result = await primaryProvider.sendFax({
        to,
        from,
        pages,
        documentUrl,
        residencyZone,
        tier
      });

      const latencyMs = Date.now() - primaryStart;

      audit.logEvent({
        tenantId,
        type: "outbound_fax",
        action: "sent_primary",
        details: {
          provider: primaryProviderName,
          jobId: result.jobId,
          latencyMs
        }
      });

      return {
        provider: primaryProviderName,
        failoverProvider: null,
        jobId: result.jobId,
        latencyMs,
        routingScore: route.score
      };
    } catch (err) {
      audit.logEvent({
        tenantId,
        type: "outbound_fax",
        action: "primary_failed",
        details: {
          provider: primaryProviderName,
          error: err.message
        }
      });

      // -----------------------------
      // 3. Failover provider attempt
      // -----------------------------
      if (!failoverProvider) {
        throw new FaxNovaError("Primary provider failed and no failover available", {
          code: "NO_FAILOVER_AVAILABLE",
          provider: primaryProviderName
        });
      }

      const failoverStart = Date.now();

      try {
        const result = await failoverProvider.sendFax({
          to,
          from,
          pages,
          documentUrl,
          residencyZone,
          tier
        });

        const latencyMs = Date.now() - failoverStart;

        audit.logEvent({
          tenantId,
          type: "outbound_fax",
          action: "sent_failover",
          details: {
            provider: failoverProviderName,
            jobId: result.jobId,
            latencyMs
          }
        });

        return {
          provider: primaryProviderName,
          failoverProvider: failoverProviderName,
          jobId: result.jobId,
          latencyMs,
          routingScore: route.score
        };
      } catch (failoverErr) {
        audit.logEvent({
          tenantId,
          type: "outbound_fax",
          action: "failover_failed",
          details: {
            provider: failoverProviderName,
            error: failoverErr.message
          }
        });

        throw new FaxNovaError("Both primary and failover providers failed", {
          code: "OUTBOUND_SEND_FAILED",
          primaryProvider: primaryProviderName,
          failoverProvider: failoverProviderName,
          details: failoverErr.message
        });
      }
    }
  } catch (err) {
    throw new FaxNovaError("Outbound fax processing failed", {
      code: "OUTBOUND_PROCESSING_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  sendFax
};
