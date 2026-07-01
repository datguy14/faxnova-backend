// src/errors/ValidationError.js

const FaxError = require("./FaxError");

class ValidationError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = ValidationError;
