// src/controllers/analyticsController.js

const Fax = require("../models/Fax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../audit/auditService");

module.exports = {
  /**
   * GET /analytics/usage
   *
   * Tenant‑scoped usage analytics:
   * - totals
   * - delivered / failed counts
   * - success rate
   * - avg delivery time
   * - recent activity
   * - last 7 days usage
   */
  async getUsageAnalytics(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      // -----------------------------
      // AUDIT: Analytics viewed
      // -----------------------------
      audit.logEvent({
        tenantId,
        type: "analytics",
        action: "usage_analytics_viewed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: {}
      });

      // -----------------------------
      // 1. Totals
      // -----------------------------
      const total = await Fax.countDocuments({ tenantId });

      const delivered = await Fax.countDocuments({
        tenantId,
        status: "delivered"
      });

      const failed = await Fax.countDocuments({
        tenantId,
        status: "failed"
      });

      // -----------------------------
      // 2. Success rate
      // -----------------------------
      const successRate = total > 0 ? (delivered / total) * 100 : 0;

      // -----------------------------
      // 3. Average delivery time
      // -----------------------------
      const deliveredFaxes = await Fax.find({
        tenantId,
        status: "delivered"
      }).select("createdAt updatedAt");

      let avgDeliveryTime = 0;

      if (deliveredFaxes.length > 0) {
        const totalMs = deliveredFaxes.reduce((sum, fax) => {
          return sum + (fax.updatedAt - fax.createdAt);
        }, 0);

        avgDeliveryTime = totalMs / deliveredFaxes.length;
      }

      // -----------------------------
      // 4. Recent activity (last 20)
      // -----------------------------
      const recent = await Fax.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(20);

      // -----------------------------
      // 5. Per-day usage (last 7 days)
      // -----------------------------
      const last7Days = await Fax.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
        { $limit: 7 }
      ]);

      // -----------------------------
      // Response
      // -----------------------------
      res.json({
        success: true,
        analytics: {
          total,
          delivered,
          failed,
          successRate: Number(successRate.toFixed(2)),
          avgDeliveryTimeMs: Math.round(avgDeliveryTime),
          recent,
          last7Days
        },
        correlationId: req.correlationId
      });

    } catch (err) {
      console.error("Analytics error:", err.message);

      audit.logEvent({
        tenantId: req.tenantId || req.user?.tenantId,
        type: "analytics",
        action: "usage_analytics_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      next(
        new FaxNovaError("Failed to load analytics", {
          code: "ANALYTICS_LOAD_FAILED",
          details: err.message
        })
      );
    }
  }
};
