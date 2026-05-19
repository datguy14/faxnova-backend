// src/controllers/adminAnalyticsController.js

const Fax = require('../models/Fax');
const ApiKey = require('../models/ApiKey');
const audit = require('../audit/auditService');

exports.getAdminAnalytics = async (req, res) => {
  try {
    // -----------------------------
    // AUDIT: Admin analytics viewed
    // -----------------------------
    audit.logEvent({
      tenantId: req.tenantId,
      type: 'admin',
      action: 'admin_analytics_viewed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {}
    });

    // -----------------------------
    // 1. Global totals
    // -----------------------------
    const total = await Fax.countDocuments({});
    const delivered = await Fax.countDocuments({ status: 'delivered' });
    const failed = await Fax.countDocuments({ status: 'failed' });

    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    // -----------------------------
    // 2. Average delivery time
    // -----------------------------
    const deliveredFaxes = await Fax.find({ status: 'delivered' })
      .select('createdAt updatedAt');

    let avgDeliveryTime = 0;

    if (deliveredFaxes.length > 0) {
      const totalMs = deliveredFaxes.reduce((sum, fax) => {
        return sum + (fax.updatedAt - fax.createdAt);
      }, 0);

      avgDeliveryTime = totalMs / deliveredFaxes.length;
    }

    // -----------------------------
    // 3. Per-tenant usage
    // -----------------------------
    const perTenant = await Fax.aggregate([
      {
        $group: {
          _id: '$tenantId',
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // -----------------------------
    // 4. Per-tier usage
    // -----------------------------
    const perTier = await ApiKey.aggregate([
      {
        $lookup: {
          from: 'faxes',
          localField: '_id',
          foreignField: 'apiKeyId',
          as: 'faxUsage'
        }
      },
      {
        $group: {
          _id: '$tier',
          count: { $sum: { $size: '$faxUsage' } }
        }
      }
    ]);

    // -----------------------------
    // 5. Last 7 days global usage
    // -----------------------------
    const last7Days = await Fax.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$createdAt' },
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 7 }
    ]);

    // -----------------------------
    // 6. Recent global activity
    // -----------------------------
    const recent = await Fax.find({})
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      analytics: {
        total,
        delivered,
        failed,
        successRate: Number(successRate.toFixed(2)),
        avgDeliveryTimeMs: Math.round(avgDeliveryTime),
        perTenant,
        perTier,
        last7Days,
        recent
      },
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error('Admin analytics error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'admin',
      action: 'admin_analytics_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to load admin analytics',
      correlationId: req.correlationId
    });
  }
};
