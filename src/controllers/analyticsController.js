// src/controllers/analyticsController.js

const Fax = require('../models/Fax');
const audit = require('../audit/auditService');

exports.getUsageAnalytics = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // -----------------------------
    // AUDIT: Analytics viewed
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: 'analytics',
      action: 'usage_analytics_viewed',
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
      status: 'delivered'
    });

    const failed = await Fax.countDocuments({
      tenantId,
      status: 'failed'
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
      status: 'delivered'
    }).select('createdAt updatedAt');

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
    console.error('Analytics error:', err.message);

    audit.logEvent({
      tenantId: req.tenantId,
      type: 'analytics',
      action: 'usage_analytics_failed',
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to load analytics',
      correlationId: req.correlationId
    });
  }
};
