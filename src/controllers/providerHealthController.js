// src/controllers/providerHealth.controller.js
import { providerOutageService } from "../services/providerOutageService.js";
import { providerPerformanceService } from "../services/providerPerformanceService.js";
import { providerRoutingRules } from "../services/providerRoutingRules.js";

/**
 * Provider Health Controller
 * --------------------------
 * Returns real-time provider health, outages, performance,
 * and routing metadata for dashboards and admin tools.
 */

export const providerHealthController = {
  /**
   * GET /providers/status
   * Returns outages + performance + routing rules.
   */
  async getStatus(req, res) {
    try {
      const outages = await providerOutageService.getActiveOutages();
      const performance = await providerPerformanceService.getPerformanceSummary();
      const routing = providerRoutingRules.getAllProviders();

      return res.status(200).json({
        outages,
        performance,
        routing
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch provider status",
        details: err.message
      });
    }
  },

  /**
   * GET /providers/outages
   * Returns detailed outage summary.
   */
  async getOutages(req, res) {
    try {
      const summary = await providerOutageService.getOutageSummary();
      return res.status(200).json(summary);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch provider outages",
        details: err.message
      });
    }
  },

  /**
   * GET /providers/performance
   * Returns performance metrics only.
   */
  async getPerformance(req, res) {
    try {
      const performance = await providerPerformanceService.getPerformanceSummary();
      return res.status(200).json(performance);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch provider performance",
        details: err.message
      });
    }
  },

  /**
   * POST /providers/outages/clear
   * Clears outage for a provider.
   */
  async clearOutage(req, res) {
    try {
      const { provider } = req.body;
      if (!provider) {
        return res.status(400).json({ error: "Provider is required" });
      }

      await providerOutageService.clearOutage(provider);

      return res.status(200).json({
        message: `Outage cleared for provider: ${provider}`
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to clear provider outage",
        details: err.message
      });
    }
  }
};
