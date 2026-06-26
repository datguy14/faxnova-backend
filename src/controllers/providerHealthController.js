// src/controllers/providerHealthController.js

const providerOutageService = require("../services/providerOutageService");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerRoutingRules = require("../services/providerRoutingRules");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * GET /provider/health/status
   * Returns outages + performance + routing rules
   */
  async getStatus(req, res, next) {
    try {
      const outages = await providerOutageService.getActiveOutages();
      const performance = await providerPerformanceService.getPerformanceSummary();
      const routing = providerRoutingRules.getAllProviders();

      audit.log("provider_health_status_viewed", {
        user: req.user?.id,
        outagesCount: outages.length
      });

      res.status(200).json({
        outages,
        performance,
        routing
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/health/outages
   * Returns detailed outage summary
   */
  async getOutages(req, res, next) {
    try {
      const summary = await providerOutageService.getOutageSummary();

      audit.log("provider_health_outages_viewed", {
        user: req.user?.id
      });

      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/health/performance
   * Returns provider performance metrics only
   */
  async getPerformance(req, res, next) {
    try {
      const performance = await providerPerformanceService.getPerformanceSummary();

      audit.log("provider_health_performance_viewed", {
        user: req.user?.id
      });

      res.status(200).json(performance);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /provider/health/outages/clear
   * Clears outage for a provider
   */
  async clearOutage(req, res, next) {
    try {
      const { provider } = req.body;

      if (!provider) {
        throw new FaxNovaError("Provider is required to clear outage", {
          code: "PROVIDER_REQUIRED"
        });
      }

      await providerOutageService.clearOutage(provider);

      audit.log("provider_outage_cleared", {
        user: req.user?.id,
        provider
      });

      res.status(200).json({
        message: `Outage cleared for provider: ${provider}`
      });
    } catch (err) {
      next(err);
    }
  }
};
