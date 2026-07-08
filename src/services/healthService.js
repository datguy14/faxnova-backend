// src/services/healthService.js — Unified Fax Architecture (CommonJS Only)

const mongoose = require("mongoose");
const { connection: redis } = require("../lib/redis");
const outboundQueue = require("../queues/outboundQueue");
const failoverQueue = require("../queues/failoverQueue");
const webhookQueue = require("../queues/webhookQueue");
const providerApiService = require("../providers/providerApiService");
const fs = require("fs");
const path = require("path");

module.exports = {
  async getSystemHealth() {
    const mongoHealthy = mongoose.connection.readyState === 1;

    const redisHealthy = redis.status === "ready";

    const outboundQueueHealthy = await outboundQueue.getJobCounts();
    const failoverQueueHealthy = await failoverQueue.getJobCounts();
    const webhookQueueHealthy = await webhookQueue.getJobCounts();

    const providerReachability = {
      telnyx: await providerApiService.ping("telnyx"),
      sinch: await providerApiService.ping("sinch")
    };

    const storageHealthy = fs.existsSync(path.join(__dirname, "../../storage"));

    return {
      mongo: mongoHealthy,
      redis: redisHealthy,
      queues: {
        outbound: outboundQueueHealthy,
        failover: failoverQueueHealthy,
        webhook: webhookQueueHealthy
      },
      providers: providerReachability,
      storage: storageHealthy,
      timestamp: new Date().toISOString()
    };
  }
};
