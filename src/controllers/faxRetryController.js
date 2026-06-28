// src/controllers/faxRetryController.js

const FaxNovaError = require("../errors/FaxNovaError");
const retryFaxService = require("../services/retryFaxService");
const audit = require("../audit/auditService");

/**
 * Fax Retry Controller (FaxNova v1)
 *
 * Responsibilities:
 * - Extract tenant context
 * - Validate faxId
 * - Call retryFaxService (Routing Engine v2)
 * - Audit log retry attempt
 */

async function retryFax(req, res) {
  try {
    // -----------------------------
    // 1. Tenant extraction
    // -----------------------------
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    // -----------------------------
    // 2. Validate faxId
    // -----------------------------
    const faxId = req.params.faxId;

    if (!faxId) {
      throw new FaxNovaError("Missing faxId for retry", {
        code: "FAX_ID_MISSING"
      });
    }

    // -----------------------------
    // 3. Retry fax via Routing Engine v2
    // -----------------------------
    const result = await retryFaxService.retryFax({
      tenantId,
      faxId
    });

    const { provider, jobId, latencyMs, routingScore } = result;

    // -----------------------------
    // 4. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "fax_retry",
      action: "retry_controller_success",
      details: {
        faxId,
        provider,
        jobId,
        latencyMs,
        routingScore
      }
    });

    return res.status(200).json({
      success: true,
      faxId,
      provider,
      jobId,
      latencyMs,
      routingScore
    });
  } catch (err) {
    const error = new FaxNovaError("Retry fax controller failed", {
      code: "RETRY_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = {
  retryFax
};
