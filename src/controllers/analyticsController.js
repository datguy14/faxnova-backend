// src/controllers/analyticsController.js

const Fax = require("../models/Fax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * GET /analytics/usage
   * Tenant-scoped usage analytics for dashboard
   */
  async getUsageAnalytics(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Missing tenant ID", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      // Total faxes
      const total = await Fax.countDocuments({ tenantId });

      // Success rate
      const successCount = await Fax.countDocuments({
        tenantId,
        status: "success"
      });

      const successRate =
        total > 0 ? Number((successCount / total).toFixed(4)) : 0;

      // Average delivery time
      const avgDelivery = await Fax.aggregate([
        { $match: { tenantId, deliveryTimeMs: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$deliveryTimeMs" } } }
      ]);

      // Last 7 days usage
      const last7 = await Fax.aggregate([
        {
          $match: {
            tenantId,
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Recent activity
      const recent = await Fax.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(10);

      audit.log("tenant_analytics_viewed", {
        tenantId,
        user: req.user?.id
      });

      res.json({
        total,
        successRate,
        avgDeliveryTimeMs: avgDelivery[0]?.avg || null,
        last7Days: last7,
        recent
      });
    } catch (err) {
      next(err);
    }
  }
};
