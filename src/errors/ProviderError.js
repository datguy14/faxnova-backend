// src/errors/ProviderError.js

const FaxError = require("./FaxError");

class ProviderError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = ProviderError;
