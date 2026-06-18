// src/services/outboundFaxService.js
import OutboundFax from "../models/OutboundFax.js";
import { providerRouter } from "./providerRouter.js";
import { storageService } from "../storage/storageService.js";
import { faxStatusService } from "./faxStatusService.js";
import { auditService } from "../audit/auditService.js";
import { residencyEngine } from "../residency/residencyEngine.js";

export const outboundFaxService = {
  /**
   * Send a fax through the best provider.
   * Handles routing, storage, metadata, and initial status.
   */
  async sendFax({ fileBuffer, fileName, toNumber, fromNumber, tenantId, apiKey }) {
    // 1. Determine residency + sovereignty
    const residency = residencyEngine.resolveOutbound({ toNumber });

    // 2. Store media in correct residency zone
    const storedMedia = await storageService.storeOutboundFax({
      fileBuffer,
      fileName,
      residency
    });

    // 3. Select provider
    const route = await providerRouter.routeFax({
      toNumber,
      tenantId,
      apiKey
    });

    // 4. Create initial fax record
    const faxRecord = await OutboundFax.create({
      faxId: crypto.randomUUID(),
      tenantId,
      provider: route.provider,
      toNumber,
      fromNumber,
      mediaUrl: storedMedia.url,
      pages: 1,
      status: "queued",
      residencyZone: route.residencyZone,
      sovereignty: route.sovereignty,
      providerMetadata: route.providerMetadata,
      sentAt: null,
      deliveredAt: null
    });

    // 5. Send fax via provider integration
    const providerClient = await loadProviderClient(route.provider);

    const sendResult = await providerClient.sendFax({
      faxId: faxRecord.faxId,
      toNumber,
      fromNumber,
      mediaUrl: storedMedia.url
    });

    // 6. Update status to "sending"
    await faxStatusService.markSending(faxRecord.faxId, sendResult);

    // 7. Audit log
    await auditService.log({
      action: "OUTBOUND_FAX_SENT",
      faxId: faxRecord.faxId,
      tenantId,
      provider: route.provider,
      details: sendResult
    });

    return {
      faxId: faxRecord.faxId,
      provider: route.provider,
      residencyZone: route.residencyZone,
      sovereignty: route.sovereignty,
      status: "sending"
    };
  },

  /**
   * Retry a failed fax with next-best provider.
   */
  async retryFax(faxId, apiKey) {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) throw new Error("Fax not found");

    // 1. Select next-best provider
    const route = await providerRouter.routeFax({
      toNumber: fax.toNumber,
      tenantId: fax.tenantId,
      apiKey
    });

    // 2. Send again
    const providerClient = await loadProviderClient(route.provider);

    const sendResult = await providerClient.sendFax({
      faxId,
      toNumber: fax.toNumber,
      fromNumber: fax.fromNumber,
      mediaUrl: fax.mediaUrl
    });

    // 3. Update fax record
    fax.provider = route.provider;
    fax.retries += 1;
    fax.status = "retrying";
    fax.providerMetadata = route.providerMetadata;
    await fax.save();

    // 4. Audit log
    await auditService.log({
      action: "OUTBOUND_FAX_RETRY",
      faxId,
      provider: route.provider,
      details: sendResult
    });

    return {
      faxId,
      provider: route.provider,
      status: "retrying"
    };
  }
};

/**
 * Dynamically load provider integration client.
 */
async function loadProviderClient(providerName) {
  const module = await import(`../integrations/${providerName}Client.js`);
  return module.default;
}
