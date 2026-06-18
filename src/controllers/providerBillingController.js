// src/controllers/providerBilling.controller.js
import { providerBillingService } from "../services/providerBillingService.js";

/**
 * Provider Billing Controller
 * ---------------------------
 * Handles billing calculations, summaries, and
 * dashboard-facing billing endpoints.
 */

export const providerBillingController = {
  /**
   * POST /providers/billing/calculate
   * Calculate cost for a single fax.
   */
  async calculateFaxCost(req, res) {
    try {
      const { provider, pages, residencyZone, tier } = req.body;

      if (!provider || !pages || !residencyZone || !tier) {
        return res.status(400).json({
          error: "provider, pages, residencyZone, and tier are required"
        });
      }

      const result = providerBillingService.computeFaxCost({
        provider,
        pages,
        residencyZone,
        tier
      });

      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to calculate fax cost",
        details: err.message
      });
    }
  },

  /**
   * GET /providers/billing/summary?tier=pro
   * Returns billing summary for all providers.
   */
  async getBillingSummary(req, res) {
    try {
      const tier = req.query.tier || "basic";

      const summary = providerBillingService.getBillingSummary(tier);

      return res.status(200).json({
        tier,
        providers: summary
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch billing summary",
        details: err.message
      });
    }
  }
};
