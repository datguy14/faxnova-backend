// src/services/inboundFaxService.js
import InboundFax from "../models/InboundFax.js";
import { auditService } from "../audit/auditService.js";
import { residencyEngine } from "../residency/residencyEngine.js";
import { storageService } from "../storage/storageService.js";

export const inboundFaxService = {
  /**
   * Process inbound fax event from provider webhook.
   * Normalizes payload, stores metadata, applies residency rules,
   * and creates inbound fax record.
   */
  async processInbound(event) {
    const {
      provider,
      faxId,
      fromNumber,
      toNumber,
      pages,
      mediaUrl,
      timestamp,
      tenantId
    } = normalizeInboundPayload(event);

    // 1. Apply residency + sovereignty rules
    const residency = residencyEngine.resolveInbound({
      toNumber,
      provider
    });

    // 2. Store media (PDF/TIFF) in correct residency zone
    const storedMedia = await storageService.storeInboundFax({
      mediaUrl,
      faxId,
      residency
    });

    // 3. Create inbound fax record
    const inboundFax = await InboundFax.create({
      provider,
      faxId,
      fromNumber,
      toNumber,
      pages,
      mediaUrl: storedMedia.url,
      residencyZone: residency.zone,
      sovereignty: residency.sovereignty,
      tenantId,
      receivedAt: timestamp || new Date()
    });

    // 4. Audit log
    await auditService.log({
      action: "INBOUND_FAX_RECEIVED",
      provider,
      faxId,
      tenantId,
      details: inboundFax
    });

    return inboundFax;
  }
};

/**
 * Normalize inbound fax payload from different providers.
 */
function normalizeInboundPayload(event) {
  return {
    provider: event.provider || "unknown",
    faxId: event.faxId || event.id,
    fromNumber: event.from || event.callerId,
    toNumber: event.to || event.destination,
    pages: event.pages || 1,
    mediaUrl: event.mediaUrl || event.fileUrl,
    timestamp: event.timestamp || new Date(),
    tenantId: event.tenantId || null
  };
}
