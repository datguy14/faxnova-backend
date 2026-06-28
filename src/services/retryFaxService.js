// src/services/retryFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const { routeAndSendFax } = require("./routingService.v2");
const providerOutageService = require("./providerOutageService");
const audit = require("../audit/auditService");

async function retryFax(faxId) {
  try {
    if (!faxId) {
      throw new FaxNovaError("Missing faxId for retry", {
        code: "RETRY_FAXID_MISSING"
      });
    }

    // Unified outbound fax lookup
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Outbound fax not found", {
        code: "OUTBOUND_FAX_NOT_FOUND",
        faxId
      });
    }

    // Prevent retrying delivered faxes
    if (fax.status === "delivered") {
      throw new FaxNovaError("Cannot retry delivered fax", {
        code: "RETRY_DELIVERED_FAX",
        faxId
      });
    }

    // Mark provider failure for outage tracking
    await providerOutageService.recordFailure(fax.provider);

    // Route + Send via Routing Engine v2 (failover aware)
    const result = await routeAndSendFax({
      tenantId: fax.tenantId,
      to: fax.to,
      from: fax.from,
      pages: fax.pages,
      documentUrl: fax.documentUrl,
      tier: fax.tier,
      faxId: fax.faxId, // unified FaxNova ID
      retry: true
    });

    // Update fax record with failover provider + new jobId
    fax.failoverProvider = result.provider;
    fax.jobId = result.jobId;
    fax.status = "sending";
    fax.latencyMs = result.latencyMs;
    fax.routingScore = result.routingScore;

    await fax.save();

    // Audit
    audit.logEvent({
      tenantId: fax.tenantId,
      type: "fax_outbound",
      action: "retry",
      details: {
        faxId: fax.faxId,
        originalProvider: fax.provider,
        failoverProvider: result.provider,
        jobId: result.jobId,
        latencyMs: result.latencyMs,
        routingScore: result.routingScore
      }
    });

    return {
      faxId: fax.faxId,
      provider: result.provider,
      jobId: result.jobId,
      latencyMs: result.latencyMs,
      routingScore: result.routingScore
    };
  } catch (err) {
    throw new FaxNovaError("RetryFaxService failed", {
      code: "RETRY_FAX_FAILED",
      details: err.message
    });
  }
}

module.exports = { retryFax };
