// src/errors/RoutingError.js

const FaxError = require("./FaxError");

class RoutingError extends FaxError {
  constructor(message, context = {}) {
    super(message, context);
  }
}

module.exports = RoutingError;
