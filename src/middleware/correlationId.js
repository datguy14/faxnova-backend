// src/middleware/correlationId.js

const { randomUUID } = require('crypto');

/**
 * Ensures every request has a correlation ID for tracing.
 * - Respects incoming X-Correlation-Id header
 * - Generates a UUID if missing
 * - Attaches to req.correlationId
 * - Echoes back in response header
 */
module.exports = function correlationId(req, res, next) {
  const incoming = req.headers['x-correlation-id'];

  const id = incoming && typeof incoming === 'string'
    ? incoming.trim()
    : randomUUID();

  req.correlationId = id;
  res.setHeader('X-Correlation-Id', id);

  next();
};
