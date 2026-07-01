// src/errors/ResidencyError.js

const FaxError = require("./FaxError");

class ResidencyError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = ResidencyError;
