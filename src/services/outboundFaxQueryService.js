// src/services/outboundFaxQueryService.js
import OutboundFax from "../models/OutboundFax.js";

/**
 * Outbound Fax Query Service
 * --------------------------
 * Provides dashboard-friendly queries for outbound fax data.
 * Supports:
 *  - pagination
 *  - filtering
 *  - date ranges
 *  - provider filtering
 *  - residency filtering
 *  - status filtering
 */

export const outboundFaxQueryService = {
  /**
   * Fetch outbound faxes with filters + pagination.
   */
  async listOutboundFaxes({
    tenantId,
    page = 1,
    limit = 25,
    status,
    provider,
    residencyZone,
    fromDate,
    toDate
  }) {
    const query = { tenantId };

    if (status) query.status = status;
    if (provider) query.provider = provider;
    if (residencyZone) query.residencyZone = residencyZone;

    if (fromDate || toDate) {
      query.sentAt = {};
      if (fromDate) query.sentAt.$gte = new Date(fromDate);
      if (toDate) query.sentAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OutboundFax.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit),
      OutboundFax.countDocuments(query)
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    };
  },

  /**
   * Summary metrics for dashboard cards.
   */
  async getOutboundSummary(tenantId) {
    const total = await OutboundFax.countDocuments({ tenantId });
    const delivered = await OutboundFax.countDocuments({
      tenantId,
      status: "delivered"
    });
    const failed = await OutboundFax.countDocuments({
      tenantId,
      status: "failed"
    });

    return {
      total,
      delivered,
      failed,
      successRate: total > 0 ? delivered / total : 0
    };
  },

  /**
   * Group outbound faxes by day for charts.
   */
  async getOutboundVolumeByDay(tenantId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await OutboundFax.aggregate([
      { $match: { tenantId, sentAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$sentAt" },
            month: { $month: "$sentAt" },
            day: { $dayOfMonth: "$sentAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return results.map((r) => ({
      date: `${r._id.year}-${r._id.month}-${r._id.day}`,
      count: r.count
    }));
  }
};
