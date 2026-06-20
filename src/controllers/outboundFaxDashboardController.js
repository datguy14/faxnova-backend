const outboundFaxQueryService = require("../services/outboundFaxQueryService");
const audit = require("../audit/auditService");

const outboundFaxDashboardController = {
  async list(req, res) {
    try {
      const tenantId = req.tenantId;
      const correlationId = req.correlationId;

      const {
        page,
        limit,
        status,
        provider,
        residencyZone,
        fromDate,
        toDate
      } = req.query;

      const result = await outboundFaxQueryService.listOutboundFaxes({
        tenantId,
        page: Number(page) || 1,
        limit: Number(limit) || 25,
        status,
        provider,
        residencyZone,
        fromDate,
        toDate
      });

      audit.logEvent({
        tenantId,
        type: "dashboard",
        action: "outbound_dashboard_list_viewed",
        correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { filters: req.query }
      });

      return res.status(200).json({ ...result, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: "dashboard",
        action: "outbound_dashboard_list_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch outbound fax list",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async summary(req, res) {
    try {
      const tenantId = req.tenantId;
      const correlationId = req.correlationId;

      const summary = await outboundFaxQueryService.getOutboundSummary(tenantId);

      audit.logEvent({
        tenantId,
        type: "dashboard",
        action: "outbound_dashboard_summary_viewed",
        correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier
      });

      return res.status(200).json({ ...summary, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: "dashboard",
        action: "outbound_dashboard_summary_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch outbound fax summary",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  },

  async volume(req, res) {
    try {
      const tenantId = req.tenantId;
      const correlationId = req.correlationId;
      const days = Number(req.query.days) || 30;

      const data = await outboundFaxQueryService.getOutboundVolumeByDay(
        tenantId,
        days
      );

      audit.logEvent({
        tenantId,
        type: "dashboard",
        action: "outbound_dashboard_volume_viewed",
        correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { days }
      });

      return res.status(200).json({ ...data, correlationId });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId,
        type: "dashboard",
        action: "outbound_dashboard_volume_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      return res.status(500).json({
        error: "Failed to fetch outbound fax volume",
        details: err.message,
        correlationId: req.correlationId
      });
    }
  }
};

module.exports = outboundFaxDashboardController;
