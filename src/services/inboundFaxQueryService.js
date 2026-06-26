// src/services/inboundFaxQueryService.js

const InboundFax = require("../models/InboundFax");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Paginated inbound fax list with filters.
   */
  async listInboundFaxes({
    tenantId,
    page = 1,
    limit = 25,
    provider,
    residencyZone,
    fromDate,
    toDate
  }) {
    try {
      const query = { tenantId };

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
    } catch (err) {
      throw new FaxNovaError("Failed to list inbound faxes", {
        code: "INBOUND_LIST_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Summary metrics for dashboard cards.
   */
  async getInboundSummary(tenantId) {
    try {
      const total = await InboundFax.countDocuments({ tenantId });

      const byProvider = await InboundFax.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: "$provider",
            count: { $sum: 1 }
          }
        }
      ]);

      const byResidency = await InboundFax.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: "$residencyZone",
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        total,
        byProvider,
        byResidency
      };
    } catch (err) {
      throw new FaxNovaError("Failed to compute inbound summary", {
        code: "INBOUND_SUMMARY_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Group inbound faxes by day for charts.
   */
  async getInboundVolumeByDay(tenantId, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const results = await InboundFax.aggregate([
        {
          $match: {
            tenantId,
            receivedAt: { $gte: since }
          }
        },
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
        date: `${r._id.year}-${String(r._id.month).padStart(2, "0")}-${String(
          r._id.day
        ).padStart(2, "0")}`,
        count: r.count
      }));
    } catch (err) {
      throw new FaxNovaError("Failed to compute inbound volume", {
        code: "INBOUND_VOLUME_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Fetch a single inbound fax (tenant‑scoped).
   */
  async getInboundFaxById(id, tenantId) {
    try {
      return await InboundFax.findOne({ _id: id, tenantId });
    } catch (err) {
      throw new FaxNovaError("Failed to fetch inbound fax", {
        code: "INBOUND_FETCH_ERROR",
        faxId: id,
        details: err.message
      });
    }
  }
};
