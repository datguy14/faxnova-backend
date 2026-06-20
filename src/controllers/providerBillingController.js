const providerBillingService = require("../services/providerBillingService");
const audit = require("../audit/auditService");

const providerBillingController = {
  async calculateFaxCost(req, res) {
    try {
      const correlationId = req.correlationId;
      const { provider, pages, residencyZone, tier } = req.body;

      if (!provider || !pages || !residencyZone || !tier) {
        return res.status(400).json({
          error: "provider, pages, residencyZone, and tier are required",
          correlationId
        });
      }

      const result = providerBillingService.computeFaxCost({
        provider,
        pages,
        residencyZone,
        tier
      });

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "billing",
        action: "billing_calculated",
        correlationId,
        details: { provider, pages, residencyZone, tier }
      });

      return res.status(200).json({ ...result, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "billing",
        action: "billing_calculation_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to calculate fax cost",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async getBillingSummary(req, res) {
    try {
      const correlationId = req.correlationId;
      const tier = req.query.tier || "basic";

      const summary = providerBillingService.getBillingSummary(tier);

      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "billing",
        action: "billing_summary_viewed",
        correlationId,
        details: { tier }
      });

      return res.status(200).json({
        tier,
        providers: summary,
        correlationId
      });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || "system",
        type: "billing",
        action: "billing_summary_failed",
        correlationId: req.correlationId,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch billing summary",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  }
};

module.exports = providerBillingController;
