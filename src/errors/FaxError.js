// src/errors/FaxError.js

class FaxError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = this.constructor.name;

    this.context = {
      faxId: context.faxId || null,
      provider: context.provider || null,
      externalEventId: context.externalEventId || null,
      residencyZone: context.residencyZone || null,
      sovereigntyConstraints: context.sovereigntyConstraints || null,
      retryCount: context.retryCount || 0,
      ...context,
    };

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = FaxError;
