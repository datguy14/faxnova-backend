const providerOutageService = require("../services/providerOutageService");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerRoutingRules = require("../services/providerRoutingRules");
const audit = require("../audit/auditService");

const providerHealthController = {
  async getStatus(req, res) {
    try {
      const correlationId = req.correlationId;

      const outages = await providerOutageService.getActiveOutages();
      const performance = await providerPerformanceService.getPerformanceSummary();
      const routing = providerRoutingRules.getAllProviders();

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_status_viewed",
        correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier
      });

      return res.status(200).json({
        outages,
        performance,
        routing,
        correlationId
      });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_status_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch provider status",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async getOutages(req, res) {
    try {
      const correlationId = req.correlationId;

      const summary = await providerOutageService.getOutageSummary();

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_outages_viewed",
        correlationId
      });

      return res.status(200).json({ ...summary, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_outages_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch provider outages",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async getPerformance(req, res) {
    try {
      const correlationId = req.correlationId;

      const performance = await providerPerformanceService.getPerformanceSummary();

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_performance_viewed",
        correlationId
      });

      return res.status(200).json({ ...performance, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_performance_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch provider performance",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async clearOutage(req, res) {
    try {
      const { provider } = req.body;
      const correlationId = req.correlationId;

      if (!provider) {
        return res.status(400).json({
          error: "Provider is required",
          correlationId
        });
      }

      await providerOutageService.clearOutage(provider);

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_outage_cleared",
        correlationId,
        details: { provider }
      });

      return res.status(200).json({
        message: `Outage cleared for provider: ${provider}`,
        correlationId
      });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "provider",
        action: "provider_outage_clear_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to clear provider outage",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  }
};

module.exports = providerHealthController;
