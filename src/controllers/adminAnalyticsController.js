// src/controllers/adminAnalyticsController.js

const Fax = require("../models/Fax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * GET /admin/analytics/usage
   * Global analytics for admin dashboard
   */
  async getGlobalUsage(req, res, next) {
    try {
      // Total faxes
      const total = await Fax.countDocuments();

      // Success rate
      const successCount = await Fax.countDocuments({ status: "success" });
      const successRate =
        total > 0 ? Number((successCount / total).toFixed(4)) : 0;

      // Average delivery time
      const avgDelivery = await Fax.aggregate([
        { $match: { deliveryTimeMs: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$deliveryTimeMs" } } }
      ]);

      // Per-tenant usage
      const perTenant = await Fax.aggregate([
        {
          $group: {
            _id: "$tenantId",
            count: { $sum: 1 },
            success: {
              $sum: {
                $cond: [{ $eq: ["$status", "success"] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            tenantId: "$_id",
            count: 1,
            successRate: {
              $cond: [
                { $eq: ["$count", 0] },
                0,
                { $divide: ["$success", "$count"] }
              ]
            }
          }
        }
      ]);

      // Last 7 days global usage
      const last7 = await Fax.aggregate([
        {
          $match: {
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
      const recent = await Fax.find().sort({ createdAt: -1 }).limit(20);

      audit.log("admin_analytics_viewed", {
        admin: req.user?.id
      });

      res.json({
        total,
        successRate,
        avgDeliveryTimeMs: avgDelivery[0]?.avg || null,
        perTenant,
        last7Days: last7,
        recent
      });
    } catch (err) {
      next(err);
    }
  }
};
