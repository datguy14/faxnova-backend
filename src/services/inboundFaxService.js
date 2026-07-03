// src/services/inboundFaxService.js — STRICT-MODE VERSION

const FaxNovaError = require("../errors/FaxNovaError");
const InboundFax = require("../models/InboundFax");
const residencyEngine = require("./residencyEngine");
const { v4: uuid } = require("uuid");

async function processInboundFax({ provider, tenantId, payload }) {
  try {
    if (!provider || !tenantId || !payload) {
      throw new FaxNovaError("Inbound fax missing required fields", {
        code: "INBOUND_FIELDS_MISSING"
      });
    }

    // 1. Normalize inbound fax fields (Sinch + Telnyx unified)
    const {
      fromNumber,
      toNumber,
      pages,
      documentUrl,
      providerMessageId,
      rawPayload
    } = payload;

    if (!fromNumber || !toNumber || !documentUrl || !providerMessageId) {
      throw new FaxNovaError("Inbound fax payload incomplete", {
        code: "INBOUND_PAYLOAD_INCOMPLETE",
        details: payload
      });
    }

    // 2. Residency + sovereignty resolution
    const residency = residencyEngine.resolveInboundResidency({ from: fromNumber });
    const { zone: residencyZone, sovereignty, region } = residency;

    // 3. Generate strict-mode faxId
    const faxId = uuid();

    // 4. Persist inbound fax record
    const fax = await InboundFax.create({
      faxId,
      tenantId,
      provider,
      providerMessageId,
      fromNumber,
      toNumber,
      pages,
      documentUrl,
      rawPayload,
      residencyZone,
      sovereignty,
      region,
      status: "received",
      receivedAt: new Date()
    });

    // 5. Return normalized + enriched inbound fax result
    return {
      faxId,
      provider,
      providerMessageId,
      fromNumber,
      toNumber,
      pages,
      documentUrl,
      residencyZone,
      sovereignty,
      region
    };

  } catch (err) {
    throw new FaxNovaError("InboundFaxService failed", {
      code: "INBOUND_SERVICE_FAILED",
      details: err.message
    });
  }
}

module.exports = { processInboundFax };
