const InboundFax = require("../models/InboundFax");

const inboundFaxQueryService = {
  async listInboundFaxes({
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
      query.receivedAt = {};
      if (fromDate) query.receivedAt.$gte = new Date(fromDate);
      if (toDate) query.receivedAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InboundFax.find(query)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit),
      InboundFax.countDocuments(query)
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    };
  },

  async getInboundSummary(tenantId) {
    const total = await InboundFax.countDocuments({ tenantId });
    const delivered = await InboundFax.countDocuments({
      tenantId,
      status: "received"
    });
    const failed = await InboundFax.countDocuments({
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

  async getInboundVolumeByDay(tenantId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await InboundFax.aggregate([
      { $match: { tenantId, receivedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$receivedAt" },
            month: { $month: "$receivedAt" },
            day: { $dayOfMonth: "$receivedAt" }
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

module.exports = inboundFaxQueryService;
