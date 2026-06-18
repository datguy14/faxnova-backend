// src/controllers/inboundFaxDashboard.controller.js
import { inboundFaxQueryService } from "../services/inboundFaxQueryService.js";

/**
 * Inbound Fax Dashboard Controller
 * --------------------------------
 * Provides dashboard-facing endpoints for:
 *  - paginated inbound fax lists
 *  - filtering (status, provider, residency, date range)
 *  - summary metrics
 *  - volume-by-day chart data
 */

export const inboundFaxDashboardController = {
  /**
   * GET /dashboard/inbound
   * Paginated + filtered inbound fax list.
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

      const result = await inboundFaxQueryService.listInboundFaxes({
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
        error: "Failed to fetch inbound fax list",
        details: err.message
      });
    }
  },

  /**
   * GET /dashboard/inbound/summary
   * Summary metrics for dashboard cards.
   */
  async summary(req, res) {
    try {
      const tenantId = req.tenantId;

      const summary = await inboundFaxQueryService.getInboundSummary(
        tenantId
      );

      return res.status(200).json(summary);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch inbound fax summary",
        details: err.message
      });
    }
  },

  /**
   * GET /dashboard/inbound/volume?days=30
   * Volume-by-day chart data.
   */
  async volume(req, res) {
    try {
      const tenantId = req.tenantId;
      const days = Number(req.query.days) || 30;

      const data = await inboundFaxQueryService.getInboundVolumeByDay(
        tenantId,
        days
      );

      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch inbound fax volume",
        details: err.message
      });
    }
  }
};
