// src/controllers/provider.controller.js

const providerRouter = require("../services/providerRouter");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerBillingService = require("../services/providerBillingService");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * GET /provider
   * Returns all providers and their routing metadata
   */
  async getAllProviders(req, res, next) {
    try {
      const providers = providerRouter.getProviders();

      audit.log("provider_list_viewed", {
        user: req.user?.id,
        count: providers.length
      });

      res.json({ providers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/status
   * Returns provider status (healthy, degraded, outage)
   */
  async getProviderStatus(req, res, next) {
    try {
      const status = await providerRouter.getProviderStatus();

      audit.log("provider_status_viewed", {
        user: req.user?.id,
        status
      });

      res.json(status);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/performance
   * Returns provider latency, success rate, routing weights
   */
  async getProviderPerformance(req, res, next) {
    try {
      const performance = await providerPerformanceService.getPerformance();

      audit.log("provider_performance_viewed", {
        user: req.user?.id
      });

      res.json(performance);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/outages
   * Returns active + historical outages
   */
  async getProviderOutages(req, res, next) {
    try {
      const outages = await providerOutageService.getOutages();

      audit.log("provider_outages_viewed", {
        user: req.user?.id
      });

      res.json(outages);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /provider/billing
   * Returns provider billing usage + cost breakdown
   */
  async getProviderBilling(req, res, next) {
    try {
      const billing = await providerBillingService.getBilling();

      audit.log("provider_billing_viewed", {
        user: req.user?.id
      });

      res.json(billing);
    } catch (err) {
      next(err);
    }
  }
};
