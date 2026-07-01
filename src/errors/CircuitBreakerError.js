// src/errors/CircuitBreakerError.js

const FaxError = require("./FaxError");

class CircuitBreakerError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = CircuitBreakerError;
