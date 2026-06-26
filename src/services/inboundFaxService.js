// src/services/inboundFaxService.js

const InboundFax = require("../models/InboundFax");
const tenantService = require("./tenantService");
const residencyEngine = require("./residencyEngine");

const sinchInboundAdapter = require("../providers/sinchInboundAdapter");
const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

/**
 * Normalize inbound payloads from different providers.
 */
function normalizePayload(provider, payload) {
  switch (provider) {
    case "sinch":
      return sinchInboundAdapter.normalize(payload);

    case "telnyx":
      return telnyxInboundAdapter.normalize(payload);

    default:
      throw new FaxNovaError("Unknown inbound provider", {
        code: "UNKNOWN_INBOUND_PROVIDER",
        provider
      });
  }
}

module.exports = {
  /**
   * Process inbound fax webhook.
   *
   * Steps:
   * 1. Normalize provider payload
   * 2. Resolve tenant by inbound number
   * 3. Detect residency zone
   * 4. Store inbound fax record
   * 5. Audit log
   */
  async processInboundFax(provider, payload) {
    // -----------------------------
    // 1. Normalize provider payload
    // -----------------------------
    const fax = normalizePayload(provider, payload);

    if (!fax.to || !fax.from || !fax.mediaUrl) {
      throw new FaxNovaError("Invalid inbound fax payload", {
        code: "INVALID_INBOUND_PAYLOAD",
        provider,
        details: fax
      });
    }

    // -----------------------------
    // 2. Resolve tenant by inbound number
    // -----------------------------
    const tenant = await tenantService.resolveTenantByNumber(fax.to);

    if (!tenant) {
      throw new FaxNovaError("No tenant found for inbound fax number", {
        code: "TENANT_NOT_FOUND",
        inboundNumber: fax.to
      });
    }

    // -----------------------------
    // 3. Detect residency zone
    // -----------------------------
    const residencyZone = residencyEngine.detectZone(fax.to);

    // -----------------------------
    // 4. Store inbound fax record
    // -----------------------------
    const record = await InboundFax.create({
      provider,
      tenantId: tenant._id,
      faxId: fax.faxId,
      fromNumber: fax.from,
      toNumber: fax.to,
      pages: fax.pages,
      mediaUrl: fax.mediaUrl,
      residencyZone,
      sovereignty: residencyEngine.getSovereignty(residencyZone),
      receivedAt: new Date()
    });

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.log("inbound_fax_received", {
      provider,
      tenantId: tenant._id,
      faxId: fax.faxId,
      from: fax.from,
      to: fax.to,
      pages: fax.pages,
      residencyZone
    });

    return record;
  }
};
