const faxStatusService = require("../services/faxStatusService");
const providerOutageService = require("../services/providerOutageService");
const providerPerformanceService = require("../services/providerPerformanceService");
const auditService = require("../services/auditService");
const inboundFaxService = require("../services/inboundFaxService");
const { writeResidencyLog } = require("../storage/residencyStorage");

/**
 * Normalize provider from headers
 */
const detectProvider = (headers) => {
  if (headers["telnyx-signature-ed25519"]) return "telnyx";
  if (headers["x-fax-provider"]) return headers["x-fax-provider"].toLowerCase();
  if (headers["user-agent"]) return headers["user-agent"].toLowerCase();
  return "unknown";
};

/**
 * Extract faxId from ANY provider payload shape
 */
const extractFaxId = (payload) => {
  return (
    payload?.faxId ||
    payload?.id ||
    payload?.data?.id ||
    payload?.data?.payload?.fax_id ||
    payload?.data?.payload?.faxId ||
    null
  );
};

/**
 * Extract status from ANY provider payload shape
 */
const extractStatus = (payload) => {
  return (
    payload?.status ||
    payload?.data?.status ||
    payload?.data?.payload?.status ||
    payload?.event_type ||
    null
  );
};

/**
 * Provider → FaxNova
 * Handles delivery receipts, status updates, failures, retries, etc.
 */
async function handleProviderStatusWebhook(req, res, next) {
  try {
    const residencyZone = req.residencyZone || "global";
    const provider = detectProvider(req.headers);
    const event = req.body;

    const faxId = extractFaxId(event);
    const status = extractStatus(event);

    // 1. Update fax status
    const updated = await faxStatusService.updateFromProvider({
      ...event,
      faxId,
      status,
      provider
    });

    // 2. Track provider performance
    await providerPerformanceService.recordEvent({ provider, status });

    // 3. Track outages if provider is failing
    if (status === "failed" || event.errorCode) {
      await providerOutageService.recordFailure(provider);
    }

    // 4. Residency log
    await writeResidencyLog(
      residencyZone,
      "provider-status-webhooks.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        provider,
        faxId,
        status,
        residencyZone
      })
    );

    // 5. Audit log
    await auditService.log({
      tenantId: updated?.tenantId || "system",
      action: "PROVIDER_STATUS_WEBHOOK",
      provider,
      faxId,
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: event
    });

    res.status(200).json({ received: true, faxId, status });
  } catch (err) {
    next(err);
  }
}

/**
 * Provider → FaxNova
 * Handles inbound fax events (PDF/TIFF URLs, metadata, caller ID).
 */
async function handleInboundFaxWebhook(req, res, next) {
  try {
    const residencyZone = req.residencyZone || "global";
    const inbound = req.body;

    // 1. Process inbound fax
    const result = await inboundFaxService.processInbound(inbound);

    // 2. Residency log
    await writeResidencyLog(
      residencyZone,
      "inbound-webhooks.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        faxId: result.faxId,
        provider: inbound.provider,
        residencyZone
      })
    );

    // 3. Audit log
    await auditService.log({
      tenantId: result.tenantId || "system",
      action: "INBOUND_FAX_WEBHOOK",
      provider: inbound.provider,
      faxId: result.faxId,
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: inbound
    });

    res.status(200).json({ received: true, faxId: result.faxId });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleProviderStatusWebhook,
  handleInboundFaxWebhook
};
