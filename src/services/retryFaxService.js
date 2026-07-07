// src/services/retryFaxService.js — Fully Updated, Production‑Ready (CommonJS Only)

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

// Primary outbound queue
const outboundFaxQueue = new Queue("outboundFaxQueue", {
  connection,
  defaultJobOptions: {
    attempts: 5,                 // retry up to 5 times
    backoff: { type: "exponential", delay: 5000 }, // 5s → 10s → 20s → 40s → 80s
    removeOnComplete: true,
    removeOnFail: false          // keep failures for DLQ inspection
  }
});

// Dead‑letter queue (DLQ)
const dlqFaxQueue = new Queue("dlqFaxQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Enqueue initial send job.
 * This is your original logic, but now enhanced with:
 * - provider routing
 * - region awareness
 * - failover provider
 * - retry caps
 * - DLQ safety
 */
exports.enqueueInitialSend = async ({ faxId, provider, region, failoverProvider }) => {
  await outboundFaxQueue.add(
    "sendFax",
    {
      faxId,
      provider,
      region,
      failoverProvider
    },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 }
    }
  );
};

/**
 * Enqueue failover send job.
 * Triggered when primary provider fails after max retries.
 */
exports.enqueueFailoverSend = async ({ faxId, failoverProvider, region }) => {
  if (!failoverProvider) {
    // No failover provider → send to DLQ
    await dlqFaxQueue.add("faxFailed", { faxId, region });
    return;
  }

  await outboundFaxQueue.add(
    "sendFax",
    {
      faxId,
      provider: failoverProvider,
      region,
      failoverProvider: null // prevent infinite failover loops
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 7000 }
    }
  );
};

/**
 * Send to DLQ explicitly.
 * Used when:
 * - both providers fail
 * - invalid payload
 * - corrupted storageKey
 * - provider rejects job permanently
 */
exports.sendToDLQ = async ({ faxId, provider, region, reason }) => {
  await dlqFaxQueue.add("faxFailed", {
    faxId,
    provider,
    region,
    reason
  });
};
