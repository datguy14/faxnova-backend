// src/guards/idempotencyGuard.js

const IdempotencyError = require("../errors/IdempotencyError");

/**
 * Idempotency Guard — Strict‑Mode Edition
 *
 * Prevents duplicate outbound fax submissions.
 * Uses the request's idempotency key (header or body) to ensure uniqueness.
 */

exports.ensureUnique = (req) => {
  const key =
    req.headers["x-idempotency-key"] ||
    req.body.idempotencyKey ||
    null;

  if (!key) {
    throw new IdempotencyError("Missing idempotency key");
  }

  // In strict-mode, we store used keys in req.app.locals.idempotencyMap
  const map = req.app.locals.idempotencyMap;

  if (!map.has(key)) {
    map.set(key, true);
    return;
  }

  throw new IdempotencyError(`Duplicate request detected for key: ${key}`);
};
