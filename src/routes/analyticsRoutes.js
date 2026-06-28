// src/routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();

const OutboundFax = require("../models/OutboundFax");
const InboundFax = require("../models/InboundFax");

/**
 * GET /analytics/summary
 * Unified outbound + inbound analytics
 */
router.get("/summary", async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const outboundCount = await OutboundFax.countDocuments({ tenantId });
    const inboundCount = await InboundFax.countDocuments({ tenantId });

    const deliveredCount = await OutboundFax.countDocuments({
      tenantId,
      status: "delivered"
    });

    const failedCount = await OutboundFax.countDocuments({
      tenantId,
      status: "failed"
    });

    return res.json({
      success: true,
      outboundCount,
      inboundCount,
      deliveredCount,
      failedCount
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /analytics/providers
 * Provider performance breakdown
 */
router.get("/providers", async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const providers = await OutboundFax.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: "$provider",
          total: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          avgLatency: { $avg: "$latencyMs" },
          avgRoutingScore: { $avg: "$routingScore" }
        }
      }
    ]);

    return res.json({
      success: true,
      providers
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /analytics/timeline
 * Outbound fax volume by day
 */
router.get("/timeline", async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const timeline = await OutboundFax.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      timeline
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
