// src/services/idempotencyGuard.js

const IdempotencyRecord = require("../models/IdempotencyRecord");
const { ConflictError } = require("../errors");

/**
 * Ensures a request with the same idempotency key
 * cannot be processed twice within the allowed window.
 *
 * Called inside outboundFaxService BEFORE sending the fax.
 */
module.exports = {
  async check({ tenantId, idempotencyKey }) {
    if (!idempotencyKey) {
      return { allowed: true };
    }

    // Look for an existing record
    const existing = await IdempotencyRecord.findOne({
      tenantId,
      key: idempotencyKey
    });

    if (existing) {
      throw new ConflictError(
        `Duplicate request blocked by idempotency guard (key: ${idempotencyKey}).`
      );
    }

    // Create a new record to lock this key
    await IdempotencyRecord.create({
      tenantId,
      key: idempotencyKey,
      createdAt: new Date()
    });

    return { allowed: true };
  }
};
