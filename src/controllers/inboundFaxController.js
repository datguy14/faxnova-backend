// src/controllers/inboundFaxController.js

const FaxNovaError = require("../errors/FaxNovaError");
const inboundFaxService = require("../services/inboundFaxService");
const tenantService = require("../services/tenantService");
const residencyEngine = require("../services/residencyEngine");
const InboundFax = require("../models/InboundFax");
const audit = require("../audit/auditService");

/**
 * Inbound Fax Controller (FaxNova v1)
 *
 * Responsibilities:
 * - Detect provider (Sinch / Telnyx)
 * - Normalize inbound payload
 * - Resolve tenant by inbound number
 * - Apply residency + sovereignty rules
 * - Create inbound fax record
 * - Audit log event
 */

async function handleInbound(req, res) {
  try {
    const providerName = req.params.provider; // "sinch" or "telnyx"
    const payload = req.body;

    if (!providerName) {
      throw new FaxNovaError("Missing inbound provider", {
        code: "INBOUND_PROVIDER_MISSING"
      });
    }

    // -----------------------------
    // 1. Normalize inbound fax
    // -----------------------------
    const normalized = await inboundFaxService.handleInbound(
      providerName,
      payload
    );

    const { from, to, pages, mediaUrl, residencyZone, sovereignty, jobId, receivedAt } =
      normalized;

    // -----------------------------
    // 2. Resolve tenant by inbound number
    // -----------------------------
    const tenant = await tenantService.resolveTenantByInboundNumber(to);

    if (!tenant) {
      throw new FaxNovaError("Inbound number not assigned to any tenant", {
        code: "TENANT_NOT_FOUND",
        inboundNumber: to
      });
    }

    const tenantId = tenant._id.toString();

    // -----------------------------
    // 3. Residency + sovereignty engine
    // -----------------------------
    const residency = residencyEngine.resolveInboundResidency({
      from,
      to,
      residencyZone,
      sovereignty
    });

    // -----------------------------
    // 4. Create inbound fax record
    // -----------------------------
    const faxRecord = await InboundFax.create({
      tenantId,
      provider: providerName,
      from,
      to,
      pages,
      mediaUrl,
      residencyZone: residency.zone,
      sovereignty: residency.sovereignty,
      jobId,
      receivedAt
    });

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "inbound_fax",
      action: "received",
      details: {
        provider: providerName,
        inboundNumber: to,
        from,
        pages,
        jobId
      }
    });

    return res.status(200).json({
      success: true,
      faxId: faxRecord._id,
      provider: providerName
    });
  } catch (err) {
    const error = new FaxNovaError("Inbound fax processing failed", {
      code: "INBOUND_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = {
  handleInbound
};
