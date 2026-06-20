const providerRouter = require("../services/providerRouter");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerBillingService = require("../services/providerBillingService");
const providerRoutingRules = require("../services/providerRoutingRules");
const audit = require("../audit/auditService");
const { writeResidencyLog } = require("../storage/residencyStorage");

async function getAllProviders(req, res, next) {
  try {
    const correlationId = req.correlationId;
    const residencyZone = req.residencyZone || "global";

    const providers = providerRoutingRules.getAllProviders();

    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_all_providers",
      correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier
    });

    await writeResidencyLog(
      residencyZone,
      "provider-metadata.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "get_all_providers",
        residencyZone
      })
    );

    res.json({ providers, correlationId });
  } catch (err) {
    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_all_providers_failed",
      correlationId: req.correlationId,
      details: { error: err.message }
    });

    next(err);
  }
}

async function getProviderStatus(req, res, next) {
  try {
    const correlationId = req.correlationId;
    const residencyZone = req.residencyZone || "global";

    const status = await providerRouter.getProviderStatus();

    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_status",
      correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier
    });

    await writeResidencyLog(
      residencyZone,
      "provider-status.log",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "get_provider_status",
        residencyZone
      })
    );

    res.json({ status, correlationId });
  } catch (err) {
    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_status_failed",
      correlationId: req.correlationId,
      details: { error: err.message }
    });

    next(err);
  }
}

async function getProviderPerformance(req, res, next) {
  try {
    const correlationId = req.correlationId;

    const performance = await providerPerformanceService.getPerformanceSummary();

    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_performance",
      correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier
    });

    res.json({ performance, correlationId });
  } catch (err) {
    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_performance_failed",
      correlationId: req.correlationId,
      details: { error: err.message }
    });

    next(err);
  }
}

async function getProviderOutages(req, res, next) {
  try {
    const correlationId = req.correlationId;

    const outages = await providerOutageService.getOutageSummary();

    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_outages",
      correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier
    });

    res.json({ outages, correlationId });
  } catch (err) {
    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_outages_failed",
      correlationId: req.correlationId,
      details: { error: err.message }
    });

    next(err);
  }
}

async function getProviderBilling(req, res, next) {
  try {
    const correlationId = req.correlationId;

    const billing = await providerBillingService.getBillingSummary();

    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_billing",
      correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier
    });

    res.json({ billing, correlationId });
  } catch (err) {
    audit.logEvent({
      tenantId: req.user?.tenantId || "system",
      userId: req.user?.id || null,
      type: "provider",
      action: "get_provider_billing_failed",
      correlationId: req.correlationId,
      details: { error: err.message }
    });

    next(err);
  }
}

module.exports = {
  getAllProviders,
  getProviderStatus,
  getProviderPerformance,
  getProviderOutages,
  getProviderBilling
};
