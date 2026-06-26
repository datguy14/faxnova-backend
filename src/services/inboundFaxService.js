// src/services/inboundFaxService.js

const InboundFax = require("../models/InboundFax");

const sinchInbound = require("../providers/sinchInboundAdapter");
const telnyxInbound = require("../providers/telnyxInboundAdapter");

const residencyEngine = require("./residencyEngine");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

const PROVIDER_MAP = {
  sinch: sinchInbound,
  telnyx: telnyxInbound
};

module.exports = {
  /**
   * Normalize inbound payload and create inbound fax record.
   *
   * Steps:
   * 1. Normalize provider payload
   * 2. Detect residency + sovereignty
   * 3. Resolve tenant (via toNumber)
   * 4. Store inbound fax record
   * 5. Emit audit event
   */
  async processInboundFax(provider, payload, tenantId) {
    try {
      const adapter = PROVIDER_MAP[provider];

      if (!adapter) {
        throw new FaxNovaError("Unknown inbound provider", {
          code: "UNKNOWN_INBOUND_PROVIDER",
          provider
        });
      }

      // -----------------------------
      // 1. Normalize provider payload
      // -----------------------------
      const normalized = adapter.normalize(payload);

      if (!normalized?.faxId || !normalized?.mediaUrl) {
        throw new FaxNovaError("Invalid inbound fax payload", {
          code: "INVALID_INBOUND_PAYLOAD",
          provider,
          payload
        });
      }

      // -----------------------------
      // 2. Residency + sovereignty
      // -----------------------------
      const residencyZone = residencyEngine.detectZone(normalized.to);
      const sovereignty = residencyEngine.getSovereignty(residencyZone);

      // -----------------------------
      // 3. Tenant resolution
      // (Already resolved in controller)
      // -----------------------------
      if (!tenantId) {
        throw new FaxNovaError("Tenant resolution failed", {
          code: "TENANT_RESOLUTION_FAILED",
          to: normalized.to
        });
      }

      // -----------------------------
      // 4. Create inbound fax record
      // -----------------------------
      const record = await InboundFax.create({
        faxId: normalized.faxId,
        provider,
        fromNumber: normalized.from,
        toNumber: normalized.to,
        pages: normalized.pages || 1,
        mediaUrl: normalized.mediaUrl,
        residencyZone,
        sovereignty,
        tenantId,
        receivedAt: new Date()
      });

      // -----------------------------
      // 5. Audit event
      // -----------------------------
      audit.log("inbound_fax_received", {
        provider,
        tenantId,
        faxId: normalized.faxId,
        residencyZone,
        sovereignty
      });

      return record;
    } catch (err) {
      audit.error("inbound_fax_error", {
        provider,
        error: err.message
      });

      throw new FaxNovaError("Failed to process inbound fax", {
        code: "INBOUND_FAX_ERROR",
        provider,
        details: err.message
      });
    }
  }
};
