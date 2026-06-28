// src/controllers/outboundFaxController.js

const FaxNovaError = require("../errors/FaxNovaError");
const sendFaxService = require("../services/sendFaxService");
const OutboundFax = require("../models/OutboundFax");
const audit = require("../audit/auditService");

/**
 * Outbound Fax Controller (FaxNova v1)
 *
 * Responsibilities:
 * - Extract tenant context
 * - Validate outbound fax request
 * - Call sendFaxService (Routing Engine v2 + provider adapters)
 * - Create outbound fax record
 * - Audit log event
 */

async function sendOutboundFax(req, res) {
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
    // 2. Validate request body
    // -----------------------------
    const { to, from, pages, documentUrl, residencyZone, tier } = req.body;

    if (!to || !from || !documentUrl) {
      throw new FaxNovaError("Missing required outbound fax fields", {
        code: "OUTBOUND_FIELDS_MISSING",
        fields: { to, from, documentUrl }
      });
    }

    // -----------------------------
    // 3. Send fax via Routing Engine v2
    // -----------------------------
    const result = await sendFaxService.sendFax({
      tenantId,
      to,
      from,
      pages: pages || 1,
      documentUrl,
      residencyZone: residencyZone || "us",
      tier: tier || "basic"
    });

    const {
      provider,
      failoverProvider,
      jobId,
      latencyMs,
      routingScore
    } = result;

    // -----------------------------
    // 4. Create outbound fax record
    // -----------------------------
    const faxRecord = await OutboundFax.create({
      tenantId,
      provider,
      failoverProvider,
      to,
      from,
      pages: pages || 1,
      documentUrl,
      residencyZone: residencyZone || "us",
      tier: tier || "basic",
      jobId,
      latencyMs,
      routingScore,
      createdAt: new Date()
    });

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "outbound_fax",
      action: "sent",
      details: {
        provider,
        failoverProvider,
        to,
        from,
        pages,
        jobId,
        latencyMs,
        routingScore
      }
    });

    return res.status(200).json({
      success: true,
      faxId: faxRecord._id,
      provider,
      failoverProvider,
      jobId
    });
  } catch (err) {
    const error = new FaxNovaError("Outbound fax processing failed", {
      code: "OUTBOUND_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = {
  sendOutboundFax
};
