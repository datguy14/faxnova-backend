// src/controllers/outboundFaxDashboard.controller.js
import { outboundFaxQueryService } from "../services/outboundFaxQueryService.js";

/**
 * Outbound Fax Dashboard Controller
 * ---------------------------------
 * Provides dashboard-facing endpoints for:
 *  - paginated outbound fax lists
 *  - filtering (status, provider, residency, date range)
 *  - summary metrics
 *  - volume-by-day chart data
 */

export const outboundFaxDashboardController = {
  /**
   * GET /dashboard/outbound
   * Paginated + filtered outbound fax list.
   */
  async list(req, res) {
    try {
      const tenantId = req.tenantId;

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

      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch outbound fax list",
        details: err.message
      });
    }
  },

  /**
   * GET /dashboard/outbound/summary
   * Summary metrics for dashboard cards.
   */
  async summary(req, res) {
    try {
      const tenantId = req.tenantId;

      const summary = await outboundFaxQueryService.getOutboundSummary(
        tenantId
      );

      return res.status(200).json(summary);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch outbound fax summary",
        details: err.message
      });
    }
  },

  /**
   * GET /dashboard/outbound/volume?days=30
   * Volume-by-day chart data.
   */
  async volume(req, res) {
    try {
      const tenantId = req.tenantId;
      const days = Number(req.query.days) || 30;

      const data = await outboundFaxQueryService.getOutboundVolumeByDay(
        tenantId,
        days
      );

      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch outbound fax volume",
        details: err.message
      });
    }
  }
};
