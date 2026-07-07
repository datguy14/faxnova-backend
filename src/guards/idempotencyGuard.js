// src/guards/idempotencyGuard.js — Unified Fax Architecture (CommonJS Only)

const IdempotencyError = require("../errors/IdempotencyError");
const auditService = require("../services/auditService");
const { connection } = require("../lib/redis");
const { createClient } = require("redis");

// Redis client for persistent idempotency keys
const redis = createClient({ url: connection.url });
redis.connect();

/**
 * Idempotency Guard — Unified Edition
 *
 * Prevents duplicate outbound fax submissions across:
 * - multiple Node processes
 * - BullMQ workers
 * - API servers
 * - retries
 * - failover sends
 *
 * Uses Redis for persistence.
 */

exports.ensureUnique = async ({ tenantId, faxId, idempotencyKey }) => {
  if (!idempotencyKey) {
    throw new IdempotencyError("Missing idempotency key");
  }

  const redisKey = `idempotency:${tenantId}:${idempotencyKey}`;

  // ----------------------------------------
  // 1. Check if key already exists
  // ----------------------------------------
  const exists = await redis.exists(redisKey);

  if (exists) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "IDEMPOTENCY_CHECK",
      action: "duplicate_request_blocked",
      details: { idempotencyKey }
    });

    throw new IdempotencyError(
      `Duplicate request detected for key: ${idempotencyKey}`
    );
  }

  // ----------------------------------------
  // 2. Store key with TTL (24 hours)
  // ----------------------------------------
  await redis.set(redisKey, "used", { EX: 60 * 60 * 24 });

  await auditService.logEvent({
    tenantId,
    faxId,
    type: "IDEMPOTENCY_CHECK",
    action: "request_accepted",
    details: { idempotencyKey }
  });

  return true;
};
