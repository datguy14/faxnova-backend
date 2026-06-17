// src/controllers/webhook.controller.js
import { faxStatusService } from "../services/faxStatusService.js";
import { providerOutageService } from "../services/providerOutageService.js";
import { providerPerformanceService } from "../services/providerPerformanceService.js";
import { auditService } from "../services/auditService.js";
import { inboundFaxService } from "../services/inboundFaxService.js"; // if you have it

/**
 * Provider → FaxNova
 * Handles delivery receipts, status updates, failures, retries, etc.
 */
export async function handleProviderStatusWebhook(req, res, next) {
  try {
    const event = req.body;

    // 1. Update fax status
    const updated = await faxStatusService.updateFromProvider(event);

    // 2. Track provider performance
    await providerPerformanceService.recordEvent(event);

    // 3. Track outages if provider is failing
    if (event.status === "failed" || event.errorCode) {
      await providerOutageService.recordFailure(event.provider);
    }

    // 4. Audit log
    await auditService.log({
      action: "PROVIDER_STATUS_WEBHOOK",
      provider: event.provider,
      faxId: event.faxId,
      details: event
    });

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Provider → FaxNova
 * Handles inbound fax events (PDF/TIFF URLs, metadata, caller ID).
 */
export async function handleInboundFaxWebhook(req, res, next) {
  try {
    const inbound = req.body;

    // 1. Process inbound fax (store metadata, link to tenant, etc.)
    const result = await inboundFaxService.processInbound(inbound);

    // 2. Audit log
    await auditService.log({
      action: "INBOUND_FAX_WEBHOOK",
      provider: inbound.provider,
      faxId: result.faxId,
      details: inbound
    });

    res.status(200).json({ received: true, faxId: result.faxId });
  } catch (err) {
    next(err);
  }
}
