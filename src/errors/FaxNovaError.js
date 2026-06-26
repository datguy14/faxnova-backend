// src/errors/FaxNovaError.js

class FaxNovaError extends Error {
  constructor(message, { provider = null, code = null, details = null } = {}) {
    super(message);
    this.name = "FaxNovaError";
    this.provider = provider;
    this.code = code;
    this.details = details;
  }
}

module.exports = FaxNovaError;
