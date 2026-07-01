// src/errors/IdempotencyError.js

const FaxError = require("./FaxError");

class IdempotencyError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = IdempotencyError;
